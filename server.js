/**
 * Server Entry Point
 *
 * Loads environment variables, tests the database connection, synchronises
 * Sequelize models with PostgreSQL, and starts the Express HTTP server.
 * This is the file referenced by the "start" and "dev" npm scripts.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

require('dotenv').config();

const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database');

// Import models to ensure all associations are registered before sync
require('./src/models');

const PORT = process.env.PORT || 5000;

/**
 * Starts the application:
 * 1. Tests the PostgreSQL connection
 * 2. Syncs all model schemas to the database (alter mode for dev safety)
 * 3. Starts listening for HTTP requests
 */
const startServer = async () => {
  try {
    // Verify that the database is reachable
    await testConnection();

    // Synchronise models with the database — alter adds missing columns
    // without dropping existing data (safe for development)
    await sequelize.sync({ alter: true });
    console.log('[Database] All models synchronised successfully.');

    // Seed demo data if tables are empty
    const { seedAll } = require('./src/seedData');
    await seedAll();

    // Start the HTTP server
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  Order Processing & Management API`);
      console.log(`  Server running on http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Database: ${process.env.DB_NAME || 'order_processing_db'}`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
