// src/services/water.js
import mongoose from "mongoose";
import { WaterCollection } from "../db/models/water.js";

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
  return { id: _id, ...other };
};

//update water

export const updateWaterById = async (id, ownerId, payload) => {
  const waterRecord = await WaterCollection.findOne({
    _id: id,
    owner: ownerId,
  });

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
    { new: true },
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

  const dailyData = await WaterCollection.find({
    owner: new mongoose.Types.ObjectId(userId),
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).lean();

  if (!dailyData || dailyData.length === 0) {
    return {
      data: [],
      totalAmount: 0,
      totalPercentage: 0,
    };
  }

  const totalAmount = dailyData.reduce((acc, curr) => acc + curr.amount, 0);

  const currentNorm = dailyData[dailyData.length - 1].norm;

  const totalPercentage = parseFloat(
    ((totalAmount / currentNorm) * 100).toFixed(2),
  );

  const data = dailyData.map(({ _id, ...rest }) => ({
    id: _id,
    ...rest,
  }));

  return {
    data,
    totalAmount,
    totalPercentage,
  };
};

// Get monthly water consumption

export const getMonthlyWater = async (userId, month, year) => {
  if (!month || !year) {
    throw new Error("Both 'month' and 'year' parameters are required.");
  }

  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const monthlyData = await WaterCollection.find({
    owner: new mongoose.Types.ObjectId(userId),
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  }).lean();

  const groupedByDate = monthlyData.reduce((acc, { date, amount, norm }) => {
    const day = new Date(date).getUTCDate();
    if (!acc[day]) acc[day] = { amount: 0, norm: 0 };
    acc[day].amount += amount;
    acc[day].norm = norm;
    return acc;
  }, {});

  const totalNorm = Object.values(groupedByDate).reduce(
    (acc, { norm }) => acc + norm,
    0,
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const result = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const data = groupedByDate[day] || { amount: 0, norm: totalNorm };

    return {
      date: new Date(Date.UTC(year, month - 1, day)).toISOString(),
      amount: data.amount,
      percentage: data.norm
        ? parseFloat(((data.amount / totalNorm) * 100).toFixed(2))
        : 0,
    };
  });

  return result;
};

// Get weekly water consumption
export const getWeeklyWater = async (userId, startDate) => {
  const startOfWeek = new Date(startDate);
  startOfWeek.setUTCHours(0, 0, 0, 0); // Начало недели (в понедельник)

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Конец недели (в воскресенье)
  endOfWeek.setUTCHours(23, 59, 59, 999);

  const weeklyData = await WaterCollection.find({
    owner: new mongoose.Types.ObjectId(userId),
    date: {
      $gte: startOfWeek,
      $lte: endOfWeek,
    },
  }).lean();

  if (!weeklyData || weeklyData.length === 0) {
    return {
      data: [],
      totalAmount: 0,
      totalPercentage: 0,
    };
  }

  const totalAmount = weeklyData.reduce((acc, curr) => acc + curr.amount, 0);

  const currentNorm = weeklyData[weeklyData.length - 1].norm;

  const totalPercentage = parseFloat(
    ((totalAmount / currentNorm) * 100).toFixed(2),
  );

  const data = weeklyData.map(({ _id, ...rest }) => ({
    id: _id,
    ...rest,
  }));

  return {
    data,
    totalAmount,
    totalPercentage,
  };
};
