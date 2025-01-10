// src/services/water.js
import mongoose from 'mongoose';
import { WaterCollection } from '../db/models/water.js';



//create water
export const createWater = async (payload) => {
    const { amount, norm = 2000, owner, ...rest } = payload;

    const percentage = ((amount / norm) * 100).toFixed(2);

    const water = await WaterCollection.create({
        amount,
        norm,
        percentage,
        owner,
        ...rest,
    });

    const { _id, ...other } = water.toObject();
    delete other.owner;
    return { id: _id, ...other };
};

//update water

export const updateWaterById = async (id, ownerId, payload) => {
    const waterRecord = await WaterCollection.findOne({ _id: id, owner: ownerId });

    if (!waterRecord) {
        return null;
    }

    const {
        amount = waterRecord.amount,
        date = waterRecord.date,
        norm = waterRecord.norm,
    } = payload;


    const percentage = ((amount / norm) * 100).toFixed(2);

    const updatedWater = await WaterCollection.findByIdAndUpdate(
        id,
        { amount, date, norm, percentage },
        { new: true }
    );

    return updatedWater ? updatedWater.toObject() : null;
};

//delete water

export const deleteWaterById = async (waterId) => {
    const water = await WaterCollection.findByIdAndDelete(waterId);

    if (!water) return null;

    const { _id, ...other } = water.toObject();
    return { id: _id, ...other };
};



// Get daily water consumption
export const getDailyWater = async (userId, date) => {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const filter = {
        owner: mongoose.Types.ObjectId.isValid(userId) && typeof userId === 'string'
            ? new mongoose.Types.ObjectId(userId)
            : userId,
        date: { $gte: startOfDay, $lte: endOfDay },
    };

    const dailyData = await WaterCollection.find(filter);

    if (!dailyData.length) {
        return {
            value: [],
            totalAmount: 0,
            totalPercentage: 0,
        };
    }

    const totalAmount = dailyData.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPercentage = Number(dailyData.reduce((acc, curr) => acc + curr.percentage, 0).toFixed(2));

    return {
        value: dailyData.map(({ _id, ...rest }) => ({ id: _id, ...rest })),
        totalAmount,
        totalPercentage,
    };
};


// Get monthly water consumption
export const getMonthlyWater = async (userId, month, year) => {
    if (!month || !year) {
        throw new Error('Both "month" and "year" parameters are required.');
    }

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const filter = {
        owner: mongoose.Types.ObjectId.isValid(userId) && typeof userId === 'string'
            ? new mongoose.Types.ObjectId(userId)
            : userId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
    };

    const monthlyData = await WaterCollection.find(filter);


    const groupedByDate = monthlyData.reduce((acc, { date, amount, percentage }) => {
        const day = new Date(date).getUTCDate();
        if (!acc[day]) acc[day] = { amount: 0, percentage: 0 };
        acc[day].amount += amount;
        acc[day].percentage += percentage;
        return acc;
    }, {});


    const daysInMonth = new Date(year, month, 0).getDate();
    const result = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
            date: new Date(Date.UTC(year, month - 1, day)).toISOString(),
            amount: groupedByDate[day]?.amount || 0,
            percentage: (groupedByDate[day]?.percentage || 0).toFixed(2),
        };
    });

    return result;
};
