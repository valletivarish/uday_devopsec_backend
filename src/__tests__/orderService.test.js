/**
 * Order Service Unit Tests
 *
 * Tests the pure business-logic functions in orderService that do not
 * require a database connection: order total calculation, status history
 * tracking, and status-transition validation.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const {
  calculateOrderTotals,
  addStatusHistory,
  validateTransition,
} = require('../services/orderService');

describe('Order Service — Business Logic', () => {
  // ── calculateOrderTotals ────────────────────────────────────────
  describe('calculateOrderTotals', () => {
    it('should calculate correct subtotal, tax, shipping, and total for a small order', () => {
      const items = [
        { quantity: 2, unitPrice: '10.00' },
        { quantity: 1, unitPrice: '5.50' },
      ];

      const result = calculateOrderTotals(items);

      // subtotal = (2 * 10) + (1 * 5.50) = 25.50
      expect(result.subtotal).toBe(25.50);
      // tax = 25.50 * 0.10 = 2.55
      expect(result.tax).toBe(2.55);
      // shipping = 5.99 (order under $100)
      expect(result.shippingCost).toBe(5.99);
      // total = 25.50 + 2.55 + 5.99 = 34.04
      expect(result.totalAmount).toBe(34.04);
    });

    it('should apply free shipping for orders of $100 or more', () => {
      const items = [{ quantity: 1, unitPrice: '150.00' }];

      const result = calculateOrderTotals(items);

      expect(result.subtotal).toBe(150.00);
      expect(result.shippingCost).toBe(0);
      expect(result.totalAmount).toBe(150.00 + 15.00); // subtotal + 10% tax
    });

    it('should handle an empty items array', () => {
      const result = calculateOrderTotals([]);

      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.shippingCost).toBe(5.99);
      expect(result.totalAmount).toBe(5.99);
    });
  });

  // ── addStatusHistory ────────────────────────────────────────────
  describe('addStatusHistory', () => {
    it('should append a new entry to an empty status history', () => {
      const order = { statusHistory: [] };
      const result = addStatusHistory(order, 'PLACED', 'Order placed');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('PLACED');
      expect(result[0].notes).toBe('Order placed');
      expect(result[0].timestamp).toBeDefined();
    });

    it('should preserve existing history entries', () => {
      const order = {
        statusHistory: [
          { status: 'PLACED', timestamp: '2026-01-01T00:00:00.000Z', notes: '' },
        ],
      };
      const result = addStatusHistory(order, 'PAID', 'Payment received');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('PLACED');
      expect(result[1].status).toBe('PAID');
    });

    it('should handle null statusHistory gracefully', () => {
      const order = { statusHistory: null };
      const result = addStatusHistory(order, 'PLACED');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('PLACED');
    });
  });

  // ── validateTransition ──────────────────────────────────────────
  describe('validateTransition', () => {
    it('should allow PLACED -> PAID', () => {
      expect(() => validateTransition('PLACED', 'PAID')).not.toThrow();
    });

    it('should allow PLACED -> CANCELLED', () => {
      expect(() => validateTransition('PLACED', 'CANCELLED')).not.toThrow();
    });

    it('should allow PAID -> SHIPPED', () => {
      expect(() => validateTransition('PAID', 'SHIPPED')).not.toThrow();
    });

    it('should reject PLACED -> SHIPPED (must go through PAID first)', () => {
      expect(() => validateTransition('PLACED', 'SHIPPED')).toThrow(
        /Invalid status transition/
      );
    });

    it('should reject DELIVERED -> any status (terminal state)', () => {
      expect(() => validateTransition('DELIVERED', 'CANCELLED')).toThrow(
        /terminal state/
      );
    });

    it('should reject CANCELLED -> any status (terminal state)', () => {
      expect(() => validateTransition('CANCELLED', 'PLACED')).toThrow(
        /terminal state/
      );
    });
  });
});
