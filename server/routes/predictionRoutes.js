/**
 * routes/predictionRoutes.js — Prediction and dashboard routes.
 */
const express = require("express");
const router = express.Router();
const {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePrediction,
  getDashboardStats,
} = require("../controllers/predictionController");
const auth = require("../middleware/auth");

// All prediction routes are protected
router.use(auth);

// POST /api/predict — Create a new prediction
router.post("/predict", createPrediction);

// GET /api/predictions — List all predictions (with search/filter/pagination)
router.get("/predictions", getPredictions);

// GET /api/predictions/:id — Get a single prediction
router.get("/predictions/:id", getPredictionById);

// DELETE /api/predictions/:id — Delete a prediction
router.delete("/predictions/:id", deletePrediction);

// GET /api/dashboard — Dashboard statistics
router.get("/dashboard", getDashboardStats);

module.exports = router;
