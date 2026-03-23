/**
 * Health Endpoint Tests
 *
 * Verifies that the /api/health endpoint returns a valid response
 * and that undefined routes return a 404 with an appropriate message.
 * These tests exercise the Express app without a live database.
 *
 * Author: Uday Kiran Reddy Dodda (x25166484)
 */

const request = require('supertest');
const app = require('../app');

describe('Health & Routing', () => {
  // ── Health Check ────────────────────────────────────────────────
  describe('GET /api/health', () => {
    it('should return 200 with success true and a timestamp', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('API is running');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should include the current environment in the response', async () => {
      const res = await request(app).get('/api/health');

      expect(res.body.environment).toBeDefined();
      expect(typeof res.body.environment).toBe('string');
    });
  });

  // ── 404 Handler ─────────────────────────────────────────────────
  describe('Undefined routes', () => {
    it('should return 404 for GET /api/nonexistent', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    it('should return 404 for POST to an undefined route', async () => {
      const res = await request(app)
        .post('/api/does-not-exist')
        .send({ foo: 'bar' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
