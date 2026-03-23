/**
 * Centralised Error Handler Middleware
 *
 * Catches all errors thrown during request processing and returns
 * a consistent JSON error response. Handles Sequelize validation errors,
 * unique constraint violations, and generic application errors.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

/**
 * Express error-handling middleware (4-argument signature).
 * Must be registered after all routes so it can catch their errors.
 */
const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${err.message}`);

  // Sequelize validation error — return field-level error details
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  // Sequelize unique constraint violation (e.g., duplicate email or SKU)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map(e => e.path).join(', ');
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${fields}`,
    });
  }

  // Sequelize foreign key constraint error (e.g., referencing non-existent record)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist',
    });
  }

  // Application-level errors with a custom status code
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
