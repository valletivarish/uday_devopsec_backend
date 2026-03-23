/**
 * Notification Service
 *
 * Simulates sending email and SMS notifications for order events.
 * In production, this would use nodemailer with a real SMTP server or
 * an SMS gateway API. Currently logs notifications to the console
 * for development and testing purposes.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

/**
 * Sends a notification when an order status changes.
 * Logs a formatted message to the console simulating an email dispatch.
 *
 * @param {Object} order - The order that changed status
 * @param {string} newStatus - The new status value
 * @param {Object} customer - The customer who owns the order
 */
const sendOrderStatusNotification = async (order, newStatus, customer) => {
  // Build notification content based on the new order status
  const notifications = {
    PLACED: {
      subject: `Order Confirmation - ${order.orderNumber}`,
      body: `Dear ${customer.firstName}, your order ${order.orderNumber} has been placed successfully. Total: $${order.totalAmount}`,
    },
    PAID: {
      subject: `Payment Confirmed - ${order.orderNumber}`,
      body: `Dear ${customer.firstName}, payment for order ${order.orderNumber} has been confirmed. Transaction ID: ${order.transactionId}`,
    },
    SHIPPED: {
      subject: `Order Shipped - ${order.orderNumber}`,
      body: `Dear ${customer.firstName}, your order ${order.orderNumber} has been shipped and is on its way!`,
    },
    DELIVERED: {
      subject: `Order Delivered - ${order.orderNumber}`,
      body: `Dear ${customer.firstName}, your order ${order.orderNumber} has been delivered. Thank you for your purchase!`,
    },
    CANCELLED: {
      subject: `Order Cancelled - ${order.orderNumber}`,
      body: `Dear ${customer.firstName}, your order ${order.orderNumber} has been cancelled. Any reserved stock has been released.`,
    },
  };

  const notification = notifications[newStatus];

  if (notification) {
    console.log('\n========================================');
    console.log('[Notification] EMAIL NOTIFICATION');
    console.log(`  To:      ${customer.email}`);
    console.log(`  Subject: ${notification.subject}`);
    console.log(`  Body:    ${notification.body}`);
    console.log('========================================\n');
  }
};

/**
 * Sends a low-stock alert to warehouse administrators.
 *
 * @param {Object} product - The product with low stock
 * @param {number} currentStock - Current available quantity
 */
const sendLowStockAlert = async (product, currentStock) => {
  console.log('\n========================================');
  console.log('[Notification] LOW STOCK ALERT');
  console.log(`  Product:       ${product.name} (SKU: ${product.sku})`);
  console.log(`  Current Stock: ${currentStock} units`);
  console.log(`  Action:        Please reorder immediately`);
  console.log('========================================\n');
};

module.exports = {
  sendOrderStatusNotification,
  sendLowStockAlert,
};
