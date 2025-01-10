//src/controllers/water
import { createWater } from '../services/water.js';
import { updateWaterById } from '../services/water.js';
import { deleteWaterById } from '../services/water.js';
import { getDailyWater, getMonthlyWater } from '../services/water.js';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';

// create
export const createWaterController = async (req, res) => {
    const data = {
        ...req.body,
        owner: req.user.id,
        norm: req.body.norm || req.user.waterNorm || 2000,
        date: req.body.date || new Date().toISOString(),
    };

    const water = await createWater(data);

    res.status(201).json({
        status: 201,
        message: `Successfully created a water!`,
        data: water,
    });
};



// update
export const updateWaterController = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            throw createHttpError(400, 'Invalid water record ID');
        }

        const userId = req.user.id;
        const data = { ...req.body };

        const updatedWater = await updateWaterById(id, userId, data);

        if (!updatedWater) {
            throw createHttpError(404, "Water record not found");
        }

        res.status(200).json({
            status: 200,
            message: "Successfully updated the water record!",
            data: updatedWater,
        });
    } catch (error) {
        next(error);
    }
};

//delete

export const deleteWaterController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const water = await deleteWaterById(id, userId);

        if (!water) {
            throw createHttpError(404, "Water record not found");
        }

        res.status(200).json({
            status: 200,
            message: "Successfully deleted the water record!",
            data: water,
        });
    } catch (error) {
        next(error);
    }
};

// Get daily water consumption

export const getDailyWaterController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { date } = req.query;

        if (!date) {
            throw createHttpError(400, 'The "date" query parameter is required.');
        }

        const result = await getDailyWater(userId, date);

        res.status(200).json({
            status: 200,
            message: "Daily water consumption data retrieved successfully.",
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

// Get monthly water consumption
export const getMonthlyWaterController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { month, year } = req.query;

        if (!month || !year) {
            throw createHttpError(400, 'The "month" and "year" query parameters are required.');
        }

        const result = await getMonthlyWater(userId, month, year);

        res.status(200).json({
            status: 200,
            message: "Monthly water consumption data retrieved successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};