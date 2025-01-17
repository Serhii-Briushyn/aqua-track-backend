import { Router } from "express";

import { validateBody } from "../middlewares/validateBody.js";
import {
  loginUserSchema,
  registerUserSchema,
  resetPasswordSchema,
  sendResetPasswordSchema,
  updatePasswordSchema,
  updateUserSchema,
} from "../validation/auth.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import {
  getGoogleOAuthUrlController,
  getUserController,
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

router.get("/me", authenticate, ctrlWrapper(getUserController));

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

router.get("/count", ctrlWrapper(getUserCountController));

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

router.get("/google-login", ctrlWrapper(loginWithGoogleController));

export default router;
