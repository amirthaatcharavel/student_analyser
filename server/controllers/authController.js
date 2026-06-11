/**
 * controllers/authController.js — Authentication logic.
 * 
 * Handles user registration, login, and profile retrieval.
 */
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Generate a JWT token for a given user ID.
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

/**
 * POST /api/auth/register
 * Register a new user.
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Create user (password is hashed by pre-save hook)
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email is already registered" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return token.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * GET /api/auth/profile
 * Get the authenticated user's profile.
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

module.exports = { register, login, getProfile };
