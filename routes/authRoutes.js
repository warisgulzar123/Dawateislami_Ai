const express = require('express');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Fixed Admin Credentials specified in requirements
const FIXED_ADMIN_EMAIL = 'admin@gmail.com';
const FIXED_ADMIN_PASSWORD = 'admin123';

/**
 * Ensures the fixed admin exists in MongoDB User collection
 */
const ensureAdminExists = async () => {
  try {
    const admin = await User.findOne({ email: FIXED_ADMIN_EMAIL });
    if (!admin) {
      await User.create({
        name: 'Super Admin',
        email: FIXED_ADMIN_EMAIL,
        password: FIXED_ADMIN_PASSWORD,
        role: 'admin'
      });
      console.log('✅ Fixed Admin account ensured in MongoDB (admin@gmail.com)');
    }
  } catch (err) {
    console.warn('[Admin Seed Notice]:', err.message);
  }
};

// Seed fixed admin in background
ensureAdminExists();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user / admin & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Direct Check for Fixed Admin Credentials
    if (
      normalizedEmail === FIXED_ADMIN_EMAIL &&
      password === FIXED_ADMIN_PASSWORD
    ) {
      let adminUser = await User.findOne({ email: FIXED_ADMIN_EMAIL });
      if (!adminUser) {
        adminUser = await User.create({
          name: 'Super Admin',
          email: FIXED_ADMIN_EMAIL,
          password: FIXED_ADMIN_PASSWORD,
          role: 'admin'
        });
      }

      const token = generateToken(adminUser._id, 'admin', FIXED_ADMIN_EMAIL);
      return res.status(200).json({
        success: true,
        message: 'Admin login successful.',
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name || 'Super Admin',
          email: FIXED_ADMIN_EMAIL,
          role: 'admin'
        }
      });
    }

    // 2. Regular User Authentication via MongoDB
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password. Please try again.'
      });
    }

    const token = generateToken(user._id, user.role, user.email);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred during login.'
    });
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new regular user account (Optional)
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent regular user hijacking of admin email
    if (normalizedEmail === FIXED_ADMIN_EMAIL) {
      return res.status(400).json({
        success: false,
        error: 'This email is reserved for system administration. Please login directly.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'user'
    });

    const token = generateToken(user._id, user.role, user.email);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during account registration.'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get authenticated user profile
 * @access  Private (Bearer Token)
 */
router.get('/me', protect, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('[Auth Me Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile information.'
    });
  }
});

module.exports = router;
