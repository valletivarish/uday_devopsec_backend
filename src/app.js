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
const app = express();

// ── Global Middleware ────────────────────────────────────────────────

// Enable Cross-Origin Resource Sharing for frontend integration
app.use(cors());

// Parse incoming JSON request bodies (limit 10MB for image URL arrays)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ── API Routes ───────────────────────────────────────────────────────

const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

// Mount entity routes under the /api prefix
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);

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
    version: '1.1.0',
    deployedAt: '2026-03-24T08:30:00Z',
    commit: process.env.GIT_COMMIT || 'local',
  });
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
