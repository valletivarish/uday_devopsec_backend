/**
 * Payment Service
 *
 * Simulates payment processing with a configurable success rate (90% by default).
 * In a production system this would integrate with a payment gateway like
 * Stripe or PayPal. The simulation generates realistic-looking transaction IDs
 * and introduces a small delay to mimic network latency.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const SUCCESS_RATE = 0.9; // 90% chance of payment success

/**
 * Simulates processing a payment for a given order.
 * Returns a result object with success/failure status, transaction ID,
 * and descriptive message.
 *
 * @param {Object} order - The order being paid for
 * @param {string} paymentMethod - Payment method (e.g., "credit_card")
 * @returns {Object} { success, transactionId, message }
 */
const processPayment = async (order, paymentMethod = 'credit_card') => {
  console.log(`[Payment] Processing payment of $${order.totalAmount} for order ${order.orderNumber}...`);

  // Simulate network delay (500-1500ms) to mimic real gateway response time
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Determine success based on configured probability
  const isSuccessful = Math.random() < SUCCESS_RATE;

  if (isSuccessful) {
    // Generate a unique transaction ID using timestamp and random hex
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    console.log(`[Payment] Payment SUCCESSFUL for order ${order.orderNumber}. Transaction ID: ${transactionId}`);

    return {
      success: true,
      transactionId,
      message: 'Payment processed successfully',
      paymentMethod,
      paidAt: new Date(),
    };
  } else {
    console.log(`[Payment] Payment FAILED for order ${order.orderNumber}. Reason: Simulated decline.`);

    return {
      success: false,
      transactionId: null,
      message: 'Payment declined. Please try again or use a different payment method.',
      paymentMethod,
      paidAt: null,
    };
  }
};

module.exports = { processPayment };
