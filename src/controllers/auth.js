import { THIRTY_DAYS } from "../constants/index.js";
import {
  getUserCountService,
  getUserService,
  loginOrSignupWithGoogle,
  loginUserService,
  logoutUserService,
  refreshUsersSessionService,
  registerUserService,
  resetPasswordService,
  sendResetPasswordService,
  updatePasswordService,
  updateUserService,
} from "../services/auth.js";
import { env } from "../utils/env.js";
import { generateAuthUrl } from "../utils/googleOAuth2.js";
import { saveFileToCloudinary } from "../utils/saveFileToCloudinary.js";
import { saveFileToUploadDir } from "../utils/saveFileToUploadDir.js";

const setupSession = (res, session) => {
  res.cookie("refreshToken", session.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    expires: new Date(Date.now() + THIRTY_DAYS),
  });
  res.cookie("sessionId", session._id, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    expires: new Date(Date.now() + THIRTY_DAYS),
  });
};

//--------------------registerUserController--------------------

export const registerUserController = async (req, res) => {
  const { user, session } = await registerUserService(req.body);

  res.status(201).json({
    status: 201,
    message: "Successfully registered a user!",
    data: {
      accessToken: session.accessToken,
      user,
    },
  });
};

//--------------------loginUserController--------------------

export const loginUserController = async (req, res) => {
  const { session, user } = await loginUserService(req.body);

  setupSession(res, session);

  res.json({
    status: 200,
    message: "Successfully logged in an user!",
    data: {
      accessToken: session.accessToken,
      user,
    },
  });
};

//--------------------refreshUserSessionController--------------------

export const refreshUserSessionController = async (req, res) => {
  const { session, user } = await refreshUsersSessionService({
    sessionId: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  setupSession(res, session);

  res.json({
    status: 200,
    message: "Successfully refreshed a session!",
    data: {
      accessToken: session.accessToken,
      user,
    },
  });
};

//--------------------logoutUserController--------------------

export const logoutUserController = async (req, res) => {
  await logoutUserService(req.cookies.sessionId);

  res.clearCookie("sessionId");
  res.clearCookie("refreshToken");

  res.status(204).send();
};

//--------------------getUserController--------------------

export const getUserController = async (req, res) => {
  const user = req.user;
  const userData = await getUserService(user._id);

  res.json({
    status: 200,
    message: "User data retrieved successfully",
    data: userData,
  });
};

//--------------------updateUserController--------------------

export const updateUserController = async (req, res) => {
  const { id } = req.user;
  const updates = req.body;
  const avatar = req.file;

  let avatarUrl;

  if (avatar) {
    if (env("ENABLE_CLOUDINARY") === "true") {
      avatarUrl = await saveFileToCloudinary(avatar);
    } else {
      avatarUrl = await saveFileToUploadDir(avatar);
    }
  }
  console.log("Updates being sent to service:", {
    ...updates,
    avatar: avatarUrl,
  });
  const user = await updateUserService(id, {
    ...updates,
    avatar: avatarUrl,
  });

  res.json({
    status: 200,
    message: "User updated successfully",
    data: { user },
  });
};

//--------------------updatePasswordController--------------------

export const updatePasswordController = async (req, res) => {
  const { id } = req.user;
  const { oldPassword, newPassword } = req.body;

  await updatePasswordService(id, oldPassword, newPassword);

  res.status(200).json({
    status: 200,
    message: "Password updated successfully",
  });
};

//--------------------getUserCountController--------------------

export const getUserCountController = async (req, res) => {
  const count = await getUserCountService();

  res.json({
    status: 200,
    message: "Users count retrieved successfully",
    data: {
      userCount: count,
    },
  });
};

//--------------------sendResetPasswordController--------------------

export const sendResetPasswordController = async (req, res) => {
  await sendResetPasswordService(req.body.email);

  res.json({
    message: "Reset password email was successfully sent!",
    status: 200,
    data: {},
  });
};

//--------------------resetPasswordController--------------------

export const resetPasswordController = async (req, res) => {
  await resetPasswordService(req.body);

  res.json({
    message: "Password was successfully reset!",
    status: 200,
    data: {},
  });
};

//--------------------getGoogleOAuthUrlController--------------------

export const getGoogleOAuthUrlController = async (req, res) => {
  const url = generateAuthUrl();

  res.json({
    status: 200,
    message: "Successfully get Google OAuth url!",
    data: {
      url,
    },
  });
};

//--------------------loginWithGoogleController--------------------

export const loginWithGoogleController = async (req, res) => {
  const { code } = req.query;

  const { session, user } = await loginOrSignupWithGoogle(code);

  setupSession(res, session);

  res.json({
    status: 200,
    message: "Successfully logged in via Google OAuth!",
    data: {
      accessToken: session.accessToken,
      user,
    },
  });
};
