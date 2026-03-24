/**
 * Input Validation Tests
 *
 * Verifies that express-validator middleware correctly rejects
 * invalid payloads for product and customer creation endpoints.
 * Uses supertest to simulate HTTP requests without a live database,
 * so only validation-layer behaviour is tested (requests that pass
 * validation will fail at the database layer and return 500).
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

// Generate a valid admin JWT for authenticated test requests
const JWT_SECRET = process.env.JWT_SECRET || 'order_processing_secret_key_2026';
const adminToken = jwt.sign(
  { id: 1, email: 'admin@opm.com', name: 'Admin', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const authHeader = `Bearer ${adminToken}`;

describe('Input Validation', () => {
  // ── Product Validation ──────────────────────────────────────────
  describe('POST /api/products', () => {
    it('should reject a product with missing required fields', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', authHeader)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should reject a product with a negative price', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', authHeader)
        .send({
          name: 'Test Product',
          price: -10,
          category: 'ELECTRONICS',
          sku: 'TEST-001',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'price' }),
        ])
      );
    });

    it('should reject a product with an invalid category', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', authHeader)
        .send({
          name: 'Test Product',
          price: 19.99,
          category: 'INVALID_CATEGORY',
          sku: 'TEST-002',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'category' }),
        ])
      );
    });

    it('should reject a product with a name shorter than 3 characters', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', authHeader)
        .send({
          name: 'AB',
          price: 9.99,
          category: 'BOOKS',
          sku: 'TEST-003',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
        ])
      );
    });
  });

  // ── Customer Validation ─────────────────────────────────────────
  describe('POST /api/customers', () => {
    it('should reject a customer with an invalid email', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', authHeader)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'not-an-email',
          shippingStreet: '123 Main St',
          shippingCity: 'Dublin',
          shippingState: 'Leinster',
          shippingPostcode: 'D01 AB12',
          shippingCountry: 'Ireland',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });

    it('should reject a customer with missing shipping address fields', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', authHeader)
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Order Validation ────────────────────────────────────────────
  describe('POST /api/orders', () => {
    it('should reject an order with no items', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send({
          customerId: 1,
          items: [],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'items' }),
        ])
      );
    });

    it('should reject an order without a customer ID', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', authHeader)
        .send({
          items: [{ productId: 1, quantity: 2 }],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'customerId' }),
        ])
      );
    });
  });
});
