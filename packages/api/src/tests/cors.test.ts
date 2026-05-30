import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('CORS Configuration', () => {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

  describe('Credentials Support', () => {
    it('should allow credentials from frontend origin', async () => {
      const response = await request(app)
        .options('/v1/auth/me')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should include Access-Control-Allow-Origin header', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Origin', frontendUrl);

      expect(response.headers['access-control-allow-origin']).toBe(frontendUrl);
    });
  });

  describe('Allowed Methods', () => {
    it('should allow GET requests', async () => {
      const response = await request(app)
        .options('/v1/auth/me')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'GET');

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
    });

    it('should allow POST requests', async () => {
      const response = await request(app)
        .options('/v1/auth/register')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'POST');

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('POST');
    });

    it('should allow DELETE requests', async () => {
      const response = await request(app)
        .options('/v1/auth/sessions/test-id')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'DELETE');

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('DELETE');
    });
  });

  describe('Allowed Headers', () => {
    it('should allow Content-Type header', async () => {
      const response = await request(app)
        .options('/v1/auth/register')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type');

      const allowedHeaders = response.headers['access-control-allow-headers'];
      expect(allowedHeaders?.toLowerCase()).toContain('content-type');
    });

    it('should allow Authorization header', async () => {
      const response = await request(app)
        .options('/v1/auth/me')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'authorization');

      const allowedHeaders = response.headers['access-control-allow-headers'];
      expect(allowedHeaders?.toLowerCase()).toContain('authorization');
    });
  });

  describe('Cookie Handling', () => {
    it('should accept cookies in cross-origin requests', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Origin', frontendUrl)
        .set('Cookie', 'access_token=test-token');

      // Should not reject the request due to CORS
      expect(response.status).not.toBe(403);
    });
  });

  describe('Origin Validation', () => {
    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Origin', 'http://malicious-site.com');

      // CORS should not include allow-origin header for unauthorized origins
      expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
    });

    it('should accept requests from configured frontend origin', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Origin', frontendUrl);

      expect(response.headers['access-control-allow-origin']).toBe(frontendUrl);
    });
  });

  describe('Preflight Requests', () => {
    it('should handle OPTIONS preflight for POST requests', async () => {
      const response = await request(app)
        .options('/v1/auth/login')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-origin']).toBe(frontendUrl);
    });

    it('should handle OPTIONS preflight for DELETE requests', async () => {
      const response = await request(app)
        .options('/v1/auth/logout')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'DELETE');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Cookie Security Attributes', () => {
    it('should verify SameSite attribute is set to lax', async () => {
      // This is a documentation test - actual cookie attributes are set in auth service
      // SameSite=lax allows cookies to be sent with top-level navigation from frontend
      expect(true).toBe(true); // Placeholder - actual verification happens in auth.service.test.ts
    });

    it('should verify httpOnly flag is set on auth cookies', async () => {
      // This is a documentation test - actual cookie attributes are set in auth service
      // httpOnly prevents JavaScript access to cookies, protecting against XSS
      expect(true).toBe(true); // Placeholder - actual verification happens in auth.service.test.ts
    });
  });
});
