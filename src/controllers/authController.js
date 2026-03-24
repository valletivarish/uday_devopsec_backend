/**
 * Auth Controller
 *
 * Handles user login and returns JWT token with user profile.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'order_processing_secret_key_2026';

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`[Auth] User "${user.name}" (${user.role}) logged in`);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  return res.json({
    success: true,
    data: req.user,
  });
};

module.exports = { login, me };
