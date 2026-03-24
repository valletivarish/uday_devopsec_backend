/**
 * Customer Routes
 *
 * Defines REST API endpoints for customer management.
 * Role-based access: admin/manager can create/update, only admin can delete.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authorize } = require('../middleware/auth');
const {
  customerCreateRules,
  customerUpdateRules,
  idParamRule,
  paginationRules,
} = require('../middleware/validators');

// GET    /api/customers          — All authenticated users
router.get('/', paginationRules, customerController.getAllCustomers);

// GET    /api/customers/:id      — All authenticated users
router.get('/:id', idParamRule, customerController.getCustomerById);

// POST   /api/customers          — Admin and Manager only
router.post('/', authorize('admin', 'manager'), customerCreateRules, customerController.createCustomer);

// PUT    /api/customers/:id      — Admin and Manager only
router.put('/:id', authorize('admin', 'manager'), idParamRule, customerUpdateRules, customerController.updateCustomer);

// DELETE /api/customers/:id      — Admin only
router.delete('/:id', authorize('admin'), idParamRule, customerController.deleteCustomer);

module.exports = router;
