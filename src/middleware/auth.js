/**
 * Authentication & Authorization Middleware
 *
 * Verifies JWT tokens and enforces role-based access control.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.warn('[Security] WARNING: JWT_SECRET not set in environment variables');
}
const JWT_SECRET = process.env.JWT_SECRET || 'order_processing_secret_key_2026';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
