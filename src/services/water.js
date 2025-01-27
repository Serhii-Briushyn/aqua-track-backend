// src/services/water.js
import mongoose from "mongoose";
import { WaterCollection } from "../db/models/water.js";

// create water
export const createWater = async (payload) => {
  const { amount, norm = 2000, owner, date, ...rest } = payload;

  const userDate = date ? new Date(date) : new Date();

  const dateInUTC = new Date(
    userDate.getTime() - userDate.getTimezoneOffset() * 60000,
  );

  const percentage = ((amount / norm) * 100).toFixed(2);

  const water = await WaterCollection.create({
    amount,
    norm,
    percentage,
    owner,
    date: dateInUTC,
    ...rest,
  });

  const { _id, ...other } = water.toObject();
  return { id: _id, ...other };
};

// update water
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

// delete water
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
    acc[day].norm = norm || 2000;
    return acc;
  }, {});

  const daysInMonth = new Date(year, month, 0).getDate();

  const result = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const data = groupedByDate[day] || { amount: 0, norm: 2000 };

    return {
      date: new Date(Date.UTC(year, month - 1, day)).toISOString(),
      amount: data.amount,
      percentage: data.norm
        ? parseFloat(((data.amount / data.norm) * 100).toFixed(2))
        : 0,
    };
  });

  return result;
};

// Get weekly water consumption
export const getWeeklyWater = async (userId, startDate) => {
  const startOfWeek = new Date(startDate);
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
  endOfWeek.setUTCHours(23, 59, 59, 999);

  const weeklyData = await WaterCollection.find({
    owner: new mongoose.Types.ObjectId(userId),
    date: { $gte: startOfWeek, $lte: endOfWeek },
  }).lean();

  if (!weeklyData || weeklyData.length === 0) {
    return {
      data: [],
      totalAmount: 0,
      totalNorm: 0,
      totalPercentage: 0,
    };
  }

  const groupedByDay = {};
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setUTCDate(startOfWeek.getUTCDate() + i);
    groupedByDay[currentDate.toISOString().split("T")[0]] = {
      date: currentDate.toISOString(),
      amount: 0,
      norm: 0,
    };
  }

  weeklyData.forEach(({ date, amount, norm }) => {
    const formattedDate = new Date(date).toISOString().split("T")[0];
    if (groupedByDay[formattedDate]) {
      groupedByDay[formattedDate].amount += amount;
      groupedByDay[formattedDate].norm =
        norm || groupedByDay[formattedDate].norm;
    }
  });

  const data = Object.values(groupedByDay).map(({ date, amount, norm }) => ({
    date, 
    amount,
    norm,
    percentage: norm ? parseFloat(((amount / norm) * 100).toFixed(2)) : 0,
  }));

  const totalAmount = data.reduce((sum, { amount }) => sum + amount, 0);
  const totalNorm = data.reduce((sum, { norm }) => sum + norm, 0);
  const totalPercentage = totalNorm
    ? parseFloat(((totalAmount / totalNorm) * 100).toFixed(2))
    : 0;

  return {
    data,
    totalAmount,
    totalNorm,
    totalPercentage,
  };
};
