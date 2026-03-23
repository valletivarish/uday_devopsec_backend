/**
 * Request Validation Rules
 *
 * Defines express-validator rule chains for all entity endpoints.
 * Each set of rules is exported as an array that can be passed directly
 * to route definitions. The handleValidationErrors middleware collects
 * any validation failures and returns them as a structured 400 response.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware that checks for validation errors from preceding rules.
 * If errors exist, returns a 400 response with detailed error messages.
 * Otherwise, passes control to the next handler.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// ── Product Validation Rules ─────────────────────────────────────────

const productCreateRules = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn(['ELECTRONICS', 'CLOTHING', 'FOOD', 'BOOKS', 'HOME', 'SPORTS', 'OTHER'])
    .withMessage('Invalid product category'),
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required'),
  body('description')
    .optional()
    .trim(),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array of URLs'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const productUpdateRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('category')
    .optional()
    .isIn(['ELECTRONICS', 'CLOTHING', 'FOOD', 'BOOKS', 'HOME', 'SPORTS', 'OTHER'])
    .withMessage('Invalid product category'),
  body('sku')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('SKU cannot be empty'),
  body('description')
    .optional()
    .trim(),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array of URLs'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

// ── Customer Validation Rules ────────────────────────────────────────

const customerCreateRules = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .trim(),
  body('shippingStreet')
    .trim()
    .notEmpty()
    .withMessage('Shipping street is required'),
  body('shippingCity')
    .trim()
    .notEmpty()
    .withMessage('Shipping city is required'),
  body('shippingState')
    .trim()
    .notEmpty()
    .withMessage('Shipping state is required'),
  body('shippingPostcode')
    .trim()
    .notEmpty()
    .withMessage('Shipping postcode is required'),
  body('shippingCountry')
    .trim()
    .notEmpty()
    .withMessage('Shipping country is required'),
  handleValidationErrors,
];

const customerUpdateRules = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .trim(),
  body('shippingStreet')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Shipping street cannot be empty'),
  body('shippingCity')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Shipping city cannot be empty'),
  body('shippingState')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Shipping state cannot be empty'),
  body('shippingPostcode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Shipping postcode cannot be empty'),
  body('shippingCountry')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Shipping country cannot be empty'),
  handleValidationErrors,
];

// ── Order Validation Rules ───────────────────────────────────────────

const orderCreateRules = [
  body('customerId')
    .isInt({ min: 1 })
    .withMessage('Valid customer ID is required'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item quantity must be at least 1'),
  body('shippingStreet')
    .optional()
    .trim(),
  body('shippingCity')
    .optional()
    .trim(),
  body('shippingState')
    .optional()
    .trim(),
  body('shippingPostcode')
    .optional()
    .trim(),
  body('shippingCountry')
    .optional()
    .trim(),
  handleValidationErrors,
];

const orderPaymentRules = [
  body('paymentMethod')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Payment method cannot be empty'),
  handleValidationErrors,
];

// ── Inventory Validation Rules ───────────────────────────────────────

const inventoryCreateRules = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),
  body('quantityInStock')
    .isInt({ min: 0 })
    .withMessage('Quantity in stock must be non-negative'),
  body('reorderPoint')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder point must be non-negative'),
  body('reorderQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Reorder quantity must be at least 1'),
  body('warehouseLocation')
    .optional()
    .trim(),
  handleValidationErrors,
];

const inventoryUpdateRules = [
  body('quantityInStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity in stock must be non-negative'),
  body('reorderPoint')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder point must be non-negative'),
  body('reorderQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Reorder quantity must be at least 1'),
  body('warehouseLocation')
    .optional()
    .trim(),
  handleValidationErrors,
];

// ── Shared Validation Rules ──────────────────────────────────────────

// Validates that :id route parameter is a positive integer
const idParamRule = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors,
];

// Validates common pagination query parameters
const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  productCreateRules,
  productUpdateRules,
  customerCreateRules,
  customerUpdateRules,
  orderCreateRules,
  orderPaymentRules,
  inventoryCreateRules,
  inventoryUpdateRules,
  idParamRule,
  paginationRules,
};
