/**
 * models/Prediction.js — Prediction schema storing each prediction result.
 * 
 * Linked to User via userId reference.
 */
const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female"],
  },
  attendanceRate: {
    type: Number,
    required: true,
  },
  priorGPA: {
    type: Number,
    required: true,
  },
  lmsLogins: {
    type: Number,
    required: true,
  },
  studyHours: {
    type: Number,
    required: true,
  },
  assignmentRate: {
    type: Number,
    required: true,
  },
  engagementScore: {
    type: Number,
    required: true,
  },
  predictedResult: {
    type: String,
    required: true,
    enum: ["High", "Medium", "Low"],
  },
  confidence: {
    type: Number,
    required: true,
  },
  probabilities: {
    High: Number,
    Medium: Number,
    Low: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Prediction", predictionSchema);
