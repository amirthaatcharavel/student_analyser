/**
 * routes/authRoutes.js — Authentication routes.
 */
const express = require("express");
const router = express.Router();
const { register, login, getProfile } = require("../controllers/authController");
const auth = require("../middleware/auth");

// POST /api/auth/register — Register a new user
router.post("/register", register);

// POST /api/auth/login — Login
router.post("/login", login);

// GET /api/auth/profile — Get user profile (protected)
router.get("/profile", auth, getProfile);

module.exports = router;
