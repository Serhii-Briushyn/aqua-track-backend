//src/controllers/water
import { createWater } from '../services/water.js';
import { updateWaterById } from '../services/water.js';
import { deleteWaterById } from '../services/water.js';
import { getDailyWater, getMonthlyWater, getWeeklyWater } from '../services/water.js';
import createHttpError from 'http-errors';


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

    const { id } = req.params;

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
};

//delete

export const deleteWaterController = async (req, res, next) => {

    const { id } = req.params;
    const userId = req.user.id;

    const water = await deleteWaterById(id, userId);

    if (!water) {
        throw createHttpError(404, "Water record not found");
    }

    res.status(204).json();
};

// Get daily water consumption

export const getDailyWaterController = async (req, res, next) => {

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
};

// Get monthly water consumption
export const getMonthlyWaterController = async (req, res, next) => {

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

};

// Get weekly water consumption
export const getWeeklyWaterController = async (req, res, next) => {
    const userId = req.user.id;
    const { startDate } = req.query;

    if (!startDate) {
        throw createHttpError(400, 'The "startDate" query parameter is required.');
    }

    const result = await getWeeklyWater(userId, startDate);

    res.status(200).json({
        status: 200,
        message: "Weekly water consumption data retrieved successfully.",
        data: result,
    });
};
