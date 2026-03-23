/**
 * Order Service
 *
 * Contains all order workflow business logic including status transitions,
 * order number generation, totals calculation, and orchestration of the
 * payment + inventory + notification services (saga pattern).
 *
 * Valid status transitions:
 *   PLACED -> PAID (via process-payment)
 *   PAID -> SHIPPED (via ship)
 *   SHIPPED -> DELIVERED (via deliver)
 *   PLACED -> CANCELLED (via cancel)
 *   PAID -> CANCELLED (via cancel, triggers refund simulation)
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const { Order, OrderItem, Product, Customer, sequelize } = require('../models');
const inventoryService = require('./inventoryService');
const paymentService = require('./paymentService');
const notificationService = require('./notificationService');

// Define which transitions are allowed from each status
const VALID_TRANSITIONS = {
  PLACED: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],     // Terminal state — no further transitions
  CANCELLED: [],     // Terminal state — no further transitions
};

/**
 * Generates a unique order number in the format ORD-YYYYMMDD-NNNN.
 * The sequence number resets daily and is derived from the current order count.
 *
 * @returns {string} A unique order number
 */
const generateOrderNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Count how many orders were created today to determine the sequence number
  const { Op } = require('sequelize');
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const count = await Order.count({
    where: {
      createdAt: {
        [Op.gte]: startOfDay,
        [Op.lt]: endOfDay,
      },
    },
  });

  // Pad the sequence number to 4 digits (e.g., 0001, 0042)
  const sequence = String(count + 1).padStart(4, '0');
  return `ORD-${dateStr}-${sequence}`;
};

/**
 * Calculates financial totals for an order based on its items.
 * Tax is computed at 10% of the subtotal. Shipping is $5.99 flat
 * for orders under $100, free otherwise.
 *
 * @param {Array} items - Array of { quantity, unitPrice } objects
 * @returns {Object} { subtotal, tax, shippingCost, totalAmount }
 */
const calculateOrderTotals = (items) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * parseFloat(item.unitPrice));
  }, 0);

  const tax = subtotal * 0.1;  // 10% tax rate
  const shippingCost = subtotal >= 100 ? 0 : 5.99;  // Free shipping over $100
  const totalAmount = subtotal + tax + shippingCost;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shippingCost: parseFloat(shippingCost.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};

/**
 * Appends a new entry to the order's status history log.
 * Each entry records the new status, timestamp, and optional notes.
 *
 * @param {Object} order - The order to update
 * @param {string} status - The new status
 * @param {string} [notes] - Optional human-readable notes
 * @returns {Array} Updated status history array
 */
const addStatusHistory = (order, status, notes = '') => {
  const history = [...(order.statusHistory || [])];
  history.push({
    status,
    timestamp: new Date().toISOString(),
    notes,
  });
  return history;
};

/**
 * Validates that a status transition is allowed.
 *
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - Desired new status
 * @throws {Error} If the transition is not allowed
 */
const validateTransition = (currentStatus, newStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
      `Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`
    );
  }
};

/**
 * Processes payment for an order. Orchestrates the payment gateway call,
 * updates order status and payment fields, and sends notifications.
 * If payment fails, the order remains in PLACED status.
 *
 * @param {number} orderId - The order to process payment for
 * @param {string} paymentMethod - Payment method identifier
 * @returns {Object} Updated order with payment details
 */
const processOrderPayment = async (orderId, paymentMethod) => {
  const order = await Order.findByPk(orderId, {
    include: [{ model: Customer, as: 'customer' }],
  });

  if (!order) {
    throw new Error('Order not found');
  }

  validateTransition(order.status, 'PAID');

  // Call the simulated payment gateway
  const paymentResult = await paymentService.processPayment(order, paymentMethod);

  if (!paymentResult.success) {
    throw new Error(paymentResult.message);
  }

  // Update order with payment confirmation details
  const statusHistory = addStatusHistory(order, 'PAID', `Payment via ${paymentMethod}. Transaction: ${paymentResult.transactionId}`);

  await order.update({
    status: 'PAID',
    paymentMethod: paymentResult.paymentMethod,
    transactionId: paymentResult.transactionId,
    paidAt: paymentResult.paidAt,
    statusHistory,
  });

  // Notify the customer of successful payment
  await notificationService.sendOrderStatusNotification(order, 'PAID', order.customer);

  return order;
};

/**
 * Ships an order. Deducts reserved stock from inventory and updates status.
 *
 * @param {number} orderId - The order to ship
 * @returns {Object} Updated order
 */
const shipOrder = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: Customer, as: 'customer' },
      { model: OrderItem, as: 'items' },
    ],
  });

  if (!order) {
    throw new Error('Order not found');
  }

  validateTransition(order.status, 'SHIPPED');

  // Use a transaction to ensure stock deduction and status update are atomic
  const transaction = await sequelize.transaction();

  try {
    // Convert reserved stock into permanent deductions
    const itemsForInventory = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await inventoryService.deductStock(itemsForInventory, transaction);

    const statusHistory = addStatusHistory(order, 'SHIPPED', 'Order has been shipped');

    await order.update(
      { status: 'SHIPPED', statusHistory },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await notificationService.sendOrderStatusNotification(order, 'SHIPPED', order.customer);

  return order;
};

/**
 * Marks an order as delivered.
 *
 * @param {number} orderId - The order to mark as delivered
 * @returns {Object} Updated order
 */
const deliverOrder = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [{ model: Customer, as: 'customer' }],
  });

  if (!order) {
    throw new Error('Order not found');
  }

  validateTransition(order.status, 'DELIVERED');

  const statusHistory = addStatusHistory(order, 'DELIVERED', 'Order has been delivered');

  await order.update({
    status: 'DELIVERED',
    statusHistory,
  });

  await notificationService.sendOrderStatusNotification(order, 'DELIVERED', order.customer);

  return order;
};

/**
 * Cancels an order and releases any reserved inventory.
 * Orders can only be cancelled if they are in PLACED or PAID status.
 *
 * @param {number} orderId - The order to cancel
 * @returns {Object} Updated order
 */
const cancelOrder = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: Customer, as: 'customer' },
      { model: OrderItem, as: 'items' },
    ],
  });

  if (!order) {
    throw new Error('Order not found');
  }

  validateTransition(order.status, 'CANCELLED');

  const transaction = await sequelize.transaction();

  try {
    // Release inventory reservations so stock becomes available again
    const itemsForInventory = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await inventoryService.releaseReservation(itemsForInventory, transaction);

    const notes = order.status === 'PAID'
      ? 'Order cancelled after payment — refund will be processed'
      : 'Order cancelled before payment';

    const statusHistory = addStatusHistory(order, 'CANCELLED', notes);

    await order.update(
      { status: 'CANCELLED', statusHistory },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await notificationService.sendOrderStatusNotification(order, 'CANCELLED', order.customer);

  return order;
};

module.exports = {
  generateOrderNumber,
  calculateOrderTotals,
  addStatusHistory,
  validateTransition,
  processOrderPayment,
  shipOrder,
  deliverOrder,
  cancelOrder,
};
