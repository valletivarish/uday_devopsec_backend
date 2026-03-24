/**
 * Auth Routes
 *
 * POST /api/auth/login  — Authenticate user and return JWT
 * GET  /api/auth/me     — Get current user profile
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
