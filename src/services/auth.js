import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import handlebars from "handlebars";
import path from "node:path";
import fs from "node:fs/promises";
import { UsersCollection } from "../db/models/user.js";
import { SessionsCollection } from "../db/models/session.js";
import {
  FIFTEEN_MINUTES,
  SMTP,
  TEMPLATES_DIR,
  THIRTY_DAYS,
} from "../constants/index.js";
import { env } from "../utils/env.js";
import { sendEmail } from "../utils/sendMail.js";
import {
  getFullNameFromGoogleTokenPayload,
  validateCode,
} from "../utils/googleOAuth2.js";

const createSession = (userId) => {
  const accessToken = randomBytes(30).toString("base64");
  const refreshToken = randomBytes(30).toString("base64");

  return {
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  };
};

//--------------------registerUserService--------------------

export const registerUserService = async (newUserData) => {
  const existingUser = await UsersCollection.findOne({
    email: newUserData.email,
  });
  if (existingUser) throw createHttpError(409, "Email in use");

  const encryptedPassword = await bcrypt.hash(newUserData.password, 10);

  const user = await UsersCollection.create({
    ...newUserData,
    password: encryptedPassword,
  });

  const newSession = createSession(user._id);

  const createdSession = await SessionsCollection.create(newSession);

  return {
    session: createdSession,
    user,
  };
};

//--------------------loginUserService--------------------

export const loginUserService = async (userData) => {
  const user = await UsersCollection.findOne({ email: userData.email });
  if (!user) {
    throw createHttpError(404, "User not found");
  }
  const isEqual = await bcrypt.compare(userData.password, user.password);

  if (!isEqual) {
    throw createHttpError(401, "Unauthorized");
  }

  await SessionsCollection.deleteOne({ userId: user._id });

  const newSession = createSession(user._id);

  const createdSession = await SessionsCollection.create(newSession);

  return {
    session: createdSession,
    user,
  };
};

//--------------------refreshUsersSessionService--------------------

export const refreshUsersSessionService = async ({
  sessionId,
  refreshToken,
}) => {
  const session = await SessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    throw createHttpError(401, "Session not found");
  }

  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  if (isSessionTokenExpired) {
    throw createHttpError(401, "Session token expired");
  }

  await SessionsCollection.deleteOne({ _id: sessionId, refreshToken });

  const user = await UsersCollection.findOne({ _id: session.userId });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const newSession = createSession(session.userId);

  const createdSession = await SessionsCollection.create(newSession);

  return {
    session: createdSession,
    user,
  };
};

//--------------------logoutUserService--------------------

export const logoutUserService = async (sessionId) => {
  if (!sessionId) {
    throw createHttpError(400, "Session ID is required");
  }

  await SessionsCollection.deleteOne({ _id: sessionId });
};

//--------------------updateUserService--------------------

export const updateUserService = async (userId, updates) => {
  const user = await UsersCollection.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
};

//--------------------updatePasswordService--------------------

export const updatePasswordService = async (
  userId,
  oldPassword,
  newPassword,
) => {
  const user = await UsersCollection.findById(userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    throw createHttpError(400, "Old password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  await user.save();
};

//--------------------getUserCountService--------------------

export const getUserCountService = async () => {
  return await UsersCollection.countDocuments();
};

//--------------------sendResetPasswordService--------------------

export const sendResetPasswordService = async (email) => {
  const user = await UsersCollection.findOne({ email });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    env("JWT_SECRET"),
    {
      expiresIn: "5m",
    },
  );

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    "reset-password-email.html",
  );

  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();

  const template = handlebars.compile(templateSource);
  const html = template({
    name: user.name,
    link: `${env("APP_DOMAIN")}/reset-password?token=${resetToken}`,
  });

  try {
    await sendEmail({
      from: env(SMTP.SMTP_FROM),
      to: email,
      subject: "Reset your password",
      html,
    });
  } catch {
    throw createHttpError(
      500,
      "Failed to send the email, please try again later.",
    );
  }
};

//--------------------resetPasswordService--------------------

export const resetPasswordService = async (resetData) => {
  let entries;

  try {
    entries = jwt.verify(resetData.token, env("JWT_SECRET"));
  } catch (err) {
    if (err) {
      throw createHttpError(401, "Token is invalid or expired.");
    }
    throw err;
  }

  const user = await UsersCollection.findOne({
    email: entries.email,
    _id: entries.sub,
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const encryptedPassword = await bcrypt.hash(resetData.password, 10);

  await UsersCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );

  await SessionsCollection.deleteMany({ userId: user._id });
};

//--------------------loginOrSignupWithGoogle--------------------

export const loginOrSignupWithGoogle = async (code) => {
  const loginTicket = await validateCode(code);
  const payload = loginTicket.getPayload();

  if (!payload) throw createHttpError(401);

  let user = await UsersCollection.findOne({ email: payload.email });
  if (!user) {
    const password = await bcrypt.hash(randomBytes(10), 10);
    user = await UsersCollection.create({
      email: payload.email,
      name: getFullNameFromGoogleTokenPayload(payload),
      password,
    });
  }

  const newSession = createSession();

  const session = await SessionsCollection.create({
    userId: user._id,
    ...newSession,
  });

  return { session, user };
};
