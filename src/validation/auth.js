import Joi from "joi";

export const registerUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(30).optional(),
  email: Joi.string().email().optional(),
  gender: Joi.string().valid("male", "female").optional(),
  weight: Joi.number().optional(),
  activeHours: Joi.number().optional(),
  waterNorm: Joi.number().optional(),
  avatar: Joi.string().uri().optional(),
});

export const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(50).required(),
});

export const sendResetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().required(),
  token: Joi.string().required(),
});
