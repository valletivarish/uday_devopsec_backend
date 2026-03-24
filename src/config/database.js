/**
 * Database Configuration Module
 *
 * Configures Sequelize ORM to connect to a PostgreSQL database.
 * Connection parameters are loaded from environment variables
 * to support different deployment environments (dev, test, prod).
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a Sequelize instance with PostgreSQL connection parameters
const sequelize = new Sequelize(
  process.env.DB_NAME || 'order_processing_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,       // Maximum number of connections in the pool
      min: 0,        // Minimum number of connections in the pool
      acquire: 30000, // Maximum time (ms) to acquire a connection before throwing error
      idle: 10000,   // Maximum time (ms) a connection can be idle before being released
    },
    // Enable SSL for RDS connections in production
    ...(process.env.NODE_ENV === 'production' && {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }),
    define: {
      timestamps: true,  // Automatically add createdAt and updatedAt fields
      underscored: false, // Use camelCase for auto-generated fields
      paranoid: true,    // Enable soft delete globally — adds deletedAt column
    },
  }
);

/**
 * Tests the database connection and logs the result.
 * This is called during application startup to verify connectivity.
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('[Database] PostgreSQL connection established successfully.');
  } catch (error) {
    console.error('[Database] Unable to connect to PostgreSQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
