import Joi from 'joi';

export const createWaterSchema = Joi.object({
    amount: Joi.number().positive().required().messages({
        'any.required': 'The "amount" field is required.',
        'number.positive': 'The "amount" field must be a positive number.',
    }),
    date: Joi.date().iso().optional().messages({
        'date.format': 'The "date" field must be in ISO format.',
    }),
    norm: Joi.number().optional().messages({
        "number.base": "The 'norm' should be a number.",
    }),
});


export const updateWaterSchema = Joi.object({
    amount: Joi.number().positive().messages({
        'number.positive': 'The "amount" field must be a positive number.',
    }),
    date: Joi.date().iso().optional().messages({
        'date.format': 'The "date" field must be in ISO format.',
    }),
    norm: Joi.number().optional().messages({
        "number.base": "The 'norm' should be a number.",
        "number.positive": "The 'norm' should be a positive number.",
    }),
});