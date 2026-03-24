/**
 * Product Routes
 *
 * Defines REST API endpoints for product management.
 * Role-based access: admin/manager can create/update, only admin can delete.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authorize } = require('../middleware/auth');
const {
  productCreateRules,
  productUpdateRules,
  idParamRule,
  paginationRules,
} = require('../middleware/validators');

// GET    /api/products          — All authenticated users
router.get('/', paginationRules, productController.getAllProducts);

// GET    /api/products/:id      — All authenticated users
router.get('/:id', idParamRule, productController.getProductById);

// POST   /api/products          — Admin and Manager only
router.post('/', authorize('admin', 'manager'), productCreateRules, productController.createProduct);

// PUT    /api/products/:id      — Admin and Manager only
router.put('/:id', authorize('admin', 'manager'), idParamRule, productUpdateRules, productController.updateProduct);

// DELETE /api/products/:id      — Admin only
router.delete('/:id', authorize('admin'), idParamRule, productController.deleteProduct);

module.exports = router;
