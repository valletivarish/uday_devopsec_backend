/**
 * Product Routes
 *
 * Defines REST API endpoints for product management.
 * All routes are prefixed with /api/products by the app router.
 * Validation middleware is applied before controller handlers.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const {
  productCreateRules,
  productUpdateRules,
  idParamRule,
  paginationRules,
} = require('../middleware/validators');

// GET    /api/products          — List all products (paginated, searchable)
router.get('/', paginationRules, productController.getAllProducts);

// GET    /api/products/:id      — Get a single product by ID
router.get('/:id', idParamRule, productController.getProductById);

// POST   /api/products          — Create a new product
router.post('/', productCreateRules, productController.createProduct);

// PUT    /api/products/:id      — Update an existing product
router.put('/:id', idParamRule, productUpdateRules, productController.updateProduct);

// DELETE /api/products/:id      — Soft-delete (deactivate) a product
router.delete('/:id', idParamRule, productController.deleteProduct);

module.exports = router;
