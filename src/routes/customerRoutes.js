/**
 * Customer Routes
 *
 * Defines REST API endpoints for customer management.
 * All routes are prefixed with /api/customers by the app router.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const {
  customerCreateRules,
  customerUpdateRules,
  idParamRule,
  paginationRules,
} = require('../middleware/validators');

// GET    /api/customers          — List all customers (paginated, searchable)
router.get('/', paginationRules, customerController.getAllCustomers);

// GET    /api/customers/:id      — Get a single customer with order history
router.get('/:id', idParamRule, customerController.getCustomerById);

// POST   /api/customers          — Register a new customer
router.post('/', customerCreateRules, customerController.createCustomer);

// PUT    /api/customers/:id      — Update customer details
router.put('/:id', idParamRule, customerUpdateRules, customerController.updateCustomer);

// DELETE /api/customers/:id      — Soft-delete (deactivate) a customer
router.delete('/:id', idParamRule, customerController.deleteCustomer);

module.exports = router;
