/**
 * Order Routes
 *
 * Defines REST API endpoints for order management and workflow operations.
 * CRUD endpoints handle basic order data, while workflow endpoints manage
 * the order lifecycle (payment, shipping, delivery, cancellation).
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const {
  orderCreateRules,
  orderPaymentRules,
  idParamRule,
  paginationRules,
} = require('../middleware/validators');

// ── CRUD Endpoints ───────────────────────────────────────────────────

// GET    /api/orders              — List all orders (paginated, filterable)
router.get('/', paginationRules, orderController.getAllOrders);

// GET    /api/orders/:id          — Get a single order with full details
router.get('/:id', idParamRule, orderController.getOrderById);

// POST   /api/orders              — Create a new order with line items
router.post('/', orderCreateRules, orderController.createOrder);

// PUT    /api/orders/:id          — Update order details (not status)
router.put('/:id', idParamRule, orderController.updateOrder);

// DELETE /api/orders/:id          — Cancel an order
router.delete('/:id', idParamRule, orderController.deleteOrder);

// ── Workflow Endpoints ───────────────────────────────────────────────

// POST   /api/orders/:id/process-payment — Process payment (PLACED -> PAID)
router.post('/:id/process-payment', idParamRule, orderPaymentRules, orderController.processPayment);

// POST   /api/orders/:id/ship            — Ship order (PAID -> SHIPPED)
router.post('/:id/ship', idParamRule, orderController.shipOrder);

// POST   /api/orders/:id/deliver         — Deliver order (SHIPPED -> DELIVERED)
router.post('/:id/deliver', idParamRule, orderController.deliverOrder);

// POST   /api/orders/:id/cancel          — Cancel order (PLACED/PAID -> CANCELLED)
router.post('/:id/cancel', idParamRule, orderController.cancelOrder);

module.exports = router;
