/**
 * Express Application Setup
 *
 * Configures the Express app with middleware, routes, and error handling.
 * This module exports the app instance without starting the HTTP server,
 * which allows it to be used independently in tests (via supertest).
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();

// ── Global Middleware ────────────────────────────────────────────────

app.use(helmet());

const allowedOrigins = [
  'https://d1i6oneop19fqr.cloudfront.net',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per window
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Parse incoming JSON request bodies (limit 10MB for image URL arrays)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ── API Routes ───────────────────────────────────────────────────────

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const { authenticate, authorize } = require('./middleware/auth');

// Public routes — rate limited to prevent brute-force attacks
app.use('/api/auth', authLimiter, authRoutes);

// Protected routes — require JWT authentication
app.use('/api/products', authenticate, productRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);

// Health check endpoint — useful for load balancers and monitoring
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Order Processing & Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Version endpoint — used to verify CI/CD deployments
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: '1.2.0',
    deployedAt: new Date().toISOString(),
    commit: process.env.GIT_COMMIT || 'local',
  });
});

// Stats endpoint — returns summary counts for the dashboard
app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const { Product, Customer, Order, Inventory } = require('./models');
    const [products, customers, orders, inventory] = await Promise.all([
      Product.count({ where: { isActive: true } }),
      Customer.count({ where: { isActive: true } }),
      Order.count(),
      Inventory.count(),
    ]);
    res.json({
      success: true,
      data: { products, customers, orders, inventory },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ── 404 Handler ──────────────────────────────────────────────────────

// Catch requests to undefined routes and return a descriptive error
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Centralised Error Handler ────────────────────────────────────────

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
