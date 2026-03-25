/**
 * Order Routes
 *
 * Defines REST API endpoints for order management and workflow operations.
 * Role-based access: admin/manager can create/update/workflow, only admin can delete.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authorize } = require('../middleware/auth');
const {
  orderCreateRules,
  orderPaymentRules,
  idParamRule,
  paginationRules,
} = require('../middleware/validators');

// ── CRUD Endpoints ───────────────────────────────────────────────────

// GET    /api/orders              — All authenticated users
router.get('/', paginationRules, orderController.getAllOrders);

// GET    /api/orders/:id          — All authenticated users
router.get('/:id', idParamRule, orderController.getOrderById);

// POST   /api/orders              — All authenticated users (viewers can place orders)
router.post('/', orderCreateRules, orderController.createOrder);

// PUT    /api/orders/:id          — Admin and Manager only
router.put('/:id', authorize('admin', 'manager'), idParamRule, orderController.updateOrder);

// DELETE /api/orders/:id          — Admin only
router.delete('/:id', authorize('admin'), idParamRule, orderController.deleteOrder);

// ── Workflow Endpoints ───────────────────────────────────────────────

// Process payment — all roles (viewer can pay their own order)
router.post('/:id/process-payment', idParamRule, orderPaymentRules, orderController.processPayment);
// Cancel — all roles (viewer can cancel their own PLACED order)
router.post('/:id/cancel', idParamRule, orderController.cancelOrder);
// Ship and Deliver — admin and manager only
router.post('/:id/ship', authorize('admin', 'manager'), idParamRule, orderController.shipOrder);
router.post('/:id/deliver', authorize('admin', 'manager'), idParamRule, orderController.deliverOrder);

module.exports = router;
