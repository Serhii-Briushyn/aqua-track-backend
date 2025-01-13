import { Router } from "express";
import cors from "cors";

import { validateBody } from "../middlewares/validateBody.js";
import {
  loginUserSchema,
  loginWithGoogleOAuthSchema,
  registerUserSchema,
  resetPasswordSchema,
  sendResetPasswordSchema,
  updatePasswordSchema,
  updateUserSchema,
} from "../validation/auth.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import {
  getGoogleOAuthUrlController,
  getUserCountController,
  loginUserController,
  loginWithGoogleController,
  logoutUserController,
  refreshUserSessionController,
  registerUserController,
  resetPasswordController,
  sendResetPasswordController,
  updatePasswordController,
  updateUserController,
} from "../controllers/auth.js";
import { authenticate } from "../middlewares/authenticate.js";
import { upload } from "../middlewares/multer.js";
import { publicCorsOptions } from "../utils/corsConfig.js";

const router = Router();

router.post(
  "/register",
  validateBody(registerUserSchema),
  ctrlWrapper(registerUserController),
);

router.post(
  "/login",
  validateBody(loginUserSchema),
  ctrlWrapper(loginUserController),
);

router.post("/refresh", ctrlWrapper(refreshUserSessionController));

router.post("/logout", ctrlWrapper(logoutUserController));

router.put(
  "/update-user",
  upload.single("avatar"),
  authenticate,
  validateBody(updateUserSchema),
  ctrlWrapper(updateUserController),
);

router.put(
  "/update-password",
  authenticate,
  validateBody(updatePasswordSchema),
  ctrlWrapper(updatePasswordController),
);

router.get(
  "/count",
  cors(publicCorsOptions),
  ctrlWrapper(getUserCountController),
);

router.post(
  "/forgot-password",
  validateBody(sendResetPasswordSchema),
  ctrlWrapper(sendResetPasswordController),
);

router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  ctrlWrapper(resetPasswordController),
);

router.get("/google-oauth-url", ctrlWrapper(getGoogleOAuthUrlController));

router.post(
  "/google-login",
  validateBody(loginWithGoogleOAuthSchema),
  ctrlWrapper(loginWithGoogleController),
);

export default router;
