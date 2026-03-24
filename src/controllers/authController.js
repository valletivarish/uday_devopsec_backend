/**
 * Auth Controller
 *
 * Handles user registration, login, and profile retrieval.
 * New registrations default to the 'viewer' role.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'order_processing_secret_key_2026';

/**
 * POST /api/auth/register
 * Creates a new user account with 'viewer' role by default.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if email is already taken
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Create user with viewer role (password is hashed by model hook)
    const user = await User.create({
      name,
      email,
      password,
      role: 'viewer',
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`[Auth] New user registered: "${user.name}" (${user.email})`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

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

module.exports = { register, login, me };
