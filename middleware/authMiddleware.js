const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dawateislami_jwt_secure_secret_2026';

/**
 * Generate JSON Web Token
 */
const generateToken = (id, role, email) => {
  return jwt.sign({ id, role, email }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

/**
 * Middleware to protect authenticated routes
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check for fixed admin token
      if (decoded.email === 'admin@gmail.com' && decoded.role === 'admin') {
        req.user = {
          _id: decoded.id || 'fixed-admin-id',
          name: 'Super Admin',
          email: 'admin@gmail.com',
          role: 'admin'
        };
        return next();
      }

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User account not found. Authorization failed.'
        });
      }

      return next();
    } catch (error) {
      console.error('[Auth Protect Error]:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Not authorized, invalid or expired token.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token provided.'
    });
  }
};

/**
 * Middleware to restrict access to Admin role only
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access denied: Admin privileges required.'
  });
};

module.exports = {
  protect,
  adminOnly,
  generateToken,
  JWT_SECRET
};
