/**
 * controllers/predictionController.js — Prediction business logic.
 * 
 * Handles creating predictions (via Flask ML API), listing, fetching,
 * deleting predictions, and dashboard statistics.
 */
const axios = require("axios");
const Prediction = require("../models/Prediction");

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5001";

/**
 * POST /api/predict
 * Send features to the Flask ML API and store the result in MongoDB.
 */
const createPrediction = async (req, res) => {
  try {
    const {
      age, gender, attendanceRate, priorGPA,
      lmsLogins, studyHours, assignmentRate, engagementScore,
    } = req.body;

    // Validate required fields
    const fields = { age, gender, attendanceRate, priorGPA, lmsLogins, studyHours, assignmentRate, engagementScore };
    const missing = Object.entries(fields).filter(([, v]) => v === undefined || v === null || v === "");
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing fields: ${missing.map(([k]) => k).join(", ")}`,
      });
    }

    // Call Flask ML API
    const flaskResponse = await axios.post(`${FLASK_API_URL}/predict`, {
      age: Number(age),
      gender: String(gender),
      attendance_rate: Number(attendanceRate),
      prior_gpa: Number(priorGPA),
      lms_logins: Number(lmsLogins),
      study_hours_per_week: Number(studyHours),
      assignment_submission_rate: Number(assignmentRate),
      engagement_score: Number(engagementScore),
    });

    const { prediction, confidence, probabilities } = flaskResponse.data;

    // Save prediction in MongoDB
    const predictionDoc = await Prediction.create({
      userId: req.user.id,
      age: Number(age),
      gender: String(gender),
      attendanceRate: Number(attendanceRate),
      priorGPA: Number(priorGPA),
      lmsLogins: Number(lmsLogins),
      studyHours: Number(studyHours),
      assignmentRate: Number(assignmentRate),
      engagementScore: Number(engagementScore),
      predictedResult: prediction,
      confidence,
      probabilities,
    });

    res.status(201).json({
      prediction: predictionDoc,
    });
  } catch (error) {
    // Handle Flask API connection errors
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "ML service is unavailable. Please ensure the Flask API is running.",
      });
    }
    
    if (error.response?.data?.error) {
      return res.status(400).json({ error: error.response.data.error });
    }
    
    console.error("Prediction error:", error.message);
    res.status(500).json({ error: "Prediction failed" });
  }
};

/**
 * GET /api/predictions
 * List all predictions for the authenticated user.
 * Supports: search, filter (by result), pagination.
 */
const getPredictions = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter, search } = req.query;
    const query = { userId: req.user.id };

    // Filter by predicted result
    if (filter && ["High", "Medium", "Low"].includes(filter)) {
      query.predictedResult = filter;
    }

    // Search by gender or result
    if (search) {
      query.$or = [
        { gender: { $regex: search, $options: "i" } },
        { predictedResult: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Prediction.countDocuments(query);
    const predictions = await Prediction.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      predictions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch predictions" });
  }
};

/**
 * GET /api/predictions/:id
 * Get a single prediction by ID (must belong to the user).
 */
const getPredictionById = async (req, res) => {
  try {
    const prediction = await Prediction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    res.json({ prediction });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch prediction" });
  }
};

/**
 * DELETE /api/predictions/:id
 * Delete a prediction by ID (must belong to the user).
 */
const deletePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    res.json({ message: "Prediction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete prediction" });
  }
};

/**
 * GET /api/dashboard
 * Aggregate dashboard statistics for the authenticated user.
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total predictions
    const total = await Prediction.countDocuments({ userId });

    // Count by performance level
    const [highCount, mediumCount, lowCount] = await Promise.all([
      Prediction.countDocuments({ userId, predictedResult: "High" }),
      Prediction.countDocuments({ userId, predictedResult: "Medium" }),
      Prediction.countDocuments({ userId, predictedResult: "Low" }),
    ]);

    // Monthly prediction trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Prediction.aggregate([
      {
        $match: {
          userId: require("mongoose").Types.ObjectId.createFromHexString(userId),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          avgConfidence: { $avg: "$confidence" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Recent predictions
    const recent = await Prediction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        total,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      monthlyTrends,
      recentPredictions: recent,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

module.exports = {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePrediction,
  getDashboardStats,
};
