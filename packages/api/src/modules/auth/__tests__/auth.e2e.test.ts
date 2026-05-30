import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { prisma } from '../../../config/prisma.js';
import { Plan, UserRole } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * End-to-End Authentication Flow Tests
 * 
 * Tests complete authentication flows from start to finish:
 * - Register → verify email → login → access protected route → logout
 * - Login → refresh token → access protected route → logout all devices
 * - Forgot password → reset → login
 * - Google OAuth → access protected route → logout
 * 
 * Requirements: All requirements (1-16)
 * Task: 25.1 Test complete authentication flows end-to-end
 */
describe('Authentication E2E Flows', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePass123!';
  const testName = 'Test User';

  // Helper to extract cookies from response
  const extractCookies = (response: request.Response): { accessToken?: string; refreshToken?: string } => {
    const cookies = response.headers['set-cookie'] as unknown as string[];
    if (!cookies) return {};

    const result: { accessToken?: string; refreshToken?: string } = {};
    
    cookies.forEach((cookie) => {
      if (cookie.startsWith('access_token=')) {
        result.accessToken = cookie.split(';')[0].split('=')[1];
      } else if (cookie.startsWith('refresh_token=')) {
        result.refreshToken = cookie.split(';')[0].split('=')[1];
      }
    });

    return result;
  };

  // Helper to create a verification token for a user
  const createVerificationToken = async (userId: string): Promise<string> => {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 12);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken: tokenHash,
        emailVerifyExpiry: expiry,
      },
    });

    return token;
  };

  // Helper to create a password reset token for a user
  const createResetToken = async (email: string): Promise<string> => {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) throw new Error('User not found');

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 12);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpiry: expiry,
      },
    });

    return token;
  };

  beforeAll(async () => {
    // Ensure database is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test-',
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-',
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('Flow 1: Register → Verify Email → Login → Access Protected Route → Logout', () => {
    const flowEmail = `flow1-${Date.now()}@example.com`;
    let userId: string;
    let verificationToken: string;
    let accessToken: string;
    let refreshToken: string;

    it('should register a new user', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          name: testName,
          email: flowEmail,
          password: testPassword,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(flowEmail);
      expect(response.body.data.user.emailVerified).toBe(false);
      expect(response.body.data.org).toBeDefined();

      // Cookies should be set
      const cookies = extractCookies(response);
      expect(cookies.accessToken).toBeDefined();
      expect(cookies.refreshToken).toBeDefined();

      userId = response.body.data.user.id;
    });

    it('should verify email with token', async () => {
      // Create verification token
      verificationToken = await createVerificationToken(userId);

      const response = await request(app)
        .get('/v1/auth/verify-email')
        .query({ token: verificationToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('verified');

      // Verify user is marked as verified
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.emailVerified).toBe(true);
      expect(user?.emailVerifyToken).toBeNull();

      // Revoke registration session to start login test fresh
      await prisma.session.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    });

    it('should login with verified credentials', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: flowEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(flowEmail);
      expect(response.body.data.user.emailVerified).toBe(true);

      const cookies = extractCookies(response);
      accessToken = cookies.accessToken!;
      refreshToken = cookies.refreshToken!;
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(flowEmail);
      expect(response.body.data.org).toBeDefined();
    });

    it('should logout and invalidate session', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Cookie', [`access_token=${accessToken}`, `refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify cookies are cleared
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.includes('access_token=;'))).toBe(true);
      expect(cookies.some((c) => c.includes('refresh_token=;'))).toBe(true);

      // Verify session is revoked
      const sessions = await prisma.session.findMany({
        where: { userId, revoked: false },
      });
      expect(sessions.length).toBe(0);
    });

    it('should not access protected route after logout', async () => {
      await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(401);
    });
  });

  describe('Flow 2: Login → Refresh Token → Access Protected Route → Logout All Devices', () => {
    const flowEmail = `flow2-${Date.now()}@example.com`;
    let accessToken1: string;
    let refreshToken1: string;
    let accessToken2: string;
    let refreshToken2: string;
    let newAccessToken: string;
    let newRefreshToken: string;

    beforeAll(async () => {
      // Create a verified user
      const passwordHash = await bcrypt.hash(testPassword, 12);
      const org = await prisma.organization.findFirst();
      
      await prisma.user.create({
        data: {
          orgId: org!.id,
          email: flowEmail,
          name: testName,
          passwordHash,
          emailVerified: true,
          role: UserRole.MEMBER,
        },
      });
    });

    it('should login from first device', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: flowEmail,
          password: testPassword,
        })
        .expect(200);

      const cookies = extractCookies(response);
      accessToken1 = cookies.accessToken!;
      refreshToken1 = cookies.refreshToken!;
      expect(accessToken1).toBeDefined();
      expect(refreshToken1).toBeDefined();
    });

    it('should login from second device', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: flowEmail,
          password: testPassword,
        })
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .expect(200);

      const cookies = extractCookies(response);
      accessToken2 = cookies.accessToken!;
      refreshToken2 = cookies.refreshToken!;
      expect(accessToken2).toBeDefined();
      expect(refreshToken2).toBeDefined();

      // Verify two active sessions exist
      const user = await prisma.user.findFirst({ where: { email: flowEmail } });
      const sessions = await prisma.session.findMany({
        where: { userId: user!.id, revoked: false },
      });
      expect(sessions.length).toBe(2);
    });

    it('should refresh token and get new access token', async () => {
      const response = await request(app)
        .post('/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken1}`])
        .expect(200);

      expect(response.body.success).toBe(true);

      const cookies = extractCookies(response);
      newAccessToken = cookies.accessToken!;
      newRefreshToken = cookies.refreshToken!;
      expect(newAccessToken).toBeDefined();
      expect(newRefreshToken).toBeDefined();
      expect(newAccessToken).not.toBe(accessToken1);
      expect(newRefreshToken).not.toBe(refreshToken1);
    });

    it('should access protected route with refreshed token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${newAccessToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(flowEmail);
    });

    it('should not be able to use old refresh token after rotation', async () => {
      await request(app)
        .post('/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken1}`])
        .expect(401);
    });

    it('should logout from all devices', async () => {
      const response = await request(app)
        .post('/v1/auth/logout-all')
        .set('Cookie', [`access_token=${newAccessToken}`, `refresh_token=${newRefreshToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionsRevoked).toBeGreaterThanOrEqual(2);

      // Verify all sessions are revoked
      const user = await prisma.user.findFirst({ where: { email: flowEmail } });
      const sessions = await prisma.session.findMany({
        where: { userId: user!.id, revoked: false },
      });
      expect(sessions.length).toBe(0);
    });

    it('should not access protected route from any device after logout all', async () => {
      await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${newAccessToken}`])
        .expect(401);

      await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${accessToken2}`])
        .expect(401);
    });
  });

  describe('Flow 3: Forgot Password → Reset → Login', () => {
    const flowEmail = `flow3-${Date.now()}@example.com`;
    const newPassword = 'NewSecurePass456!';
    let resetToken: string;
    let userId: string;

    beforeAll(async () => {
      // Create a verified user with active sessions
      const passwordHash = await bcrypt.hash(testPassword, 12);
      const org = await prisma.organization.findFirst();
      
      const user = await prisma.user.create({
        data: {
          orgId: org!.id,
          email: flowEmail,
          name: testName,
          passwordHash,
          emailVerified: true,
          role: UserRole.MEMBER,
        },
      });

      userId = user.id;

      // Create an active session
      const refreshTokenHash = await bcrypt.hash('dummy-token', 12);
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: refreshTokenHash,
          deviceInfo: { userAgent: 'test', ip: '127.0.0.1' },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    });

    it('should request password reset', async () => {
      const response = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: flowEmail })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('reset link');

      // Verify reset token was created
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.resetPasswordToken).toBeDefined();
      expect(user?.resetPasswordExpiry).toBeDefined();
    });

    it('should reset password with valid token', async () => {
      // Create reset token
      resetToken = await createResetToken(flowEmail);

      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('reset successfully');

      // Verify password was updated
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user?.resetPasswordToken).toBeNull();
      expect(user?.resetPasswordExpiry).toBeNull();
      
      // Verify password hash changed
      const isNewPasswordValid = await bcrypt.compare(newPassword, user!.passwordHash!);
      expect(isNewPasswordValid).toBe(true);
    });

    it('should have revoked all sessions after password reset', async () => {
      const sessions = await prisma.session.findMany({
        where: { userId, revoked: false },
      });
      expect(sessions.length).toBe(0);
    });

    it('should not login with old password', async () => {
      await request(app)
        .post('/v1/auth/login')
        .send({
          email: flowEmail,
          password: testPassword,
        })
        .expect(401);
    });

    it('should login with new password', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: flowEmail,
          password: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(flowEmail);

      const cookies = extractCookies(response);
      expect(cookies.accessToken).toBeDefined();
      expect(cookies.refreshToken).toBeDefined();
    });

    it('should access protected route after password reset and login', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({
          email: flowEmail,
          password: newPassword,
        })
        .expect(200);

      const cookies = extractCookies(loginResponse);

      // Access protected route
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${cookies.accessToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(flowEmail);
    });
  });

  describe('Flow 4: Google OAuth → Access Protected Route → Logout', () => {
    // Note: Full Google OAuth flow requires browser interaction and cannot be fully tested in unit tests
    // This test simulates the post-OAuth callback behavior
    
    const googleEmail = `google-${Date.now()}@example.com`;
    const googleId = `google-id-${Date.now()}`;
    let accessToken: string;
    let refreshToken: string;

    it('should create user and authenticate via Google OAuth simulation', async () => {
      // Simulate what happens after Google OAuth callback
      // In real flow, Passport would handle this, but we test the service directly
      const { authService } = await import('../auth.service.js');
      
      const result = await authService.loginWithGoogle(
        {
          googleId,
          email: googleEmail,
          name: 'Google User',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        {
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
          browser: 'Chrome',
          os: 'Windows',
        }
      );

      expect(result.user.email).toBe(googleEmail);
      expect(result.user.emailVerified).toBe(true); // Google users are pre-verified
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      accessToken = result.accessToken;
      refreshToken = result.refreshToken;
    });

    it('should access protected route with Google OAuth token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(googleEmail);
      expect(response.body.data.user.emailVerified).toBe(true);
    });

    it('should logout Google OAuth session', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Cookie', [`access_token=${accessToken}`, `refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify session is revoked
      const user = await prisma.user.findFirst({ where: { email: googleEmail } });
      const sessions = await prisma.session.findMany({
        where: { userId: user!.id, revoked: false },
      });
      expect(sessions.length).toBe(0);
    });

    it('should not access protected route after Google OAuth logout', async () => {
      await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(401);
    });

    it('should link Google account to existing email user', async () => {
      // Create a user with email/password
      const existingEmail = `existing-${Date.now()}@example.com`;
      const passwordHash = await bcrypt.hash(testPassword, 12);
      const org = await prisma.organization.findFirst();
      
      await prisma.user.create({
        data: {
          orgId: org!.id,
          email: existingEmail,
          name: 'Existing User',
          passwordHash,
          emailVerified: true,
          role: UserRole.MEMBER,
        },
      });

      // Simulate Google OAuth with same email
      const { authService } = await import('../auth.service.js');
      
      const result = await authService.loginWithGoogle(
        {
          googleId: `new-google-id-${Date.now()}`,
          email: existingEmail,
          name: 'Existing User',
        },
        {
          userAgent: 'Mozilla/5.0',
          ip: '127.0.0.1',
        }
      );

      expect(result.user.email).toBe(existingEmail);
      
      // Verify Google ID was linked
      const user = await prisma.user.findFirst({ where: { email: existingEmail } });
      expect(user?.googleId).toBeDefined();
      expect(user?.emailVerified).toBe(true);
    });
  });

  describe('Cross-Flow Integration Tests', () => {
    const crossEmail = `cross-${Date.now()}@example.com`;

    it('should handle complete user lifecycle: register → verify → login → sessions → logout all', async () => {
      // 1. Register
      const registerResponse = await request(app)
        .post('/v1/auth/register')
        .send({
          name: testName,
          email: crossEmail,
          password: testPassword,
        })
        .expect(201);

      const userId = registerResponse.body.data.user.id;

      // 2. Verify email
      const verificationToken = await createVerificationToken(userId);
      await request(app)
        .get('/v1/auth/verify-email')
        .query({ token: verificationToken })
        .expect(200);

      // Revoke registration session to start login test fresh
      await prisma.session.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });

      // 3. Login from multiple devices
      const login1 = await request(app)
        .post('/v1/auth/login')
        .send({ email: crossEmail, password: testPassword })
        .set('User-Agent', 'Device 1')
        .expect(200);

      const login2 = await request(app)
        .post('/v1/auth/login')
        .send({ email: crossEmail, password: testPassword })
        .set('User-Agent', 'Device 2')
        .expect(200);

      const cookies1 = extractCookies(login1);
      const cookies2 = extractCookies(login2);

      // 4. List sessions
      const sessionsResponse = await request(app)
        .get('/v1/auth/sessions')
        .set('Cookie', [`access_token=${cookies1.accessToken}`])
        .expect(200);

      expect(sessionsResponse.body.data.sessions.length).toBe(2);

      // 5. Logout all devices
      await request(app)
        .post('/v1/auth/logout-all')
        .set('Cookie', [`access_token=${cookies1.accessToken}`])
        .expect(200);

      // 6. Verify both sessions are invalidated
      await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${cookies1.accessToken}`])
        .expect(401);

      await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${cookies2.accessToken}`])
        .expect(401);
    });

    it('should handle password reset during active sessions', async () => {
      const resetEmail = `reset-active-${Date.now()}@example.com`;
      
      // Create user and login
      const passwordHash = await bcrypt.hash(testPassword, 12);
      const org = await prisma.organization.findFirst();
      
      const user = await prisma.user.create({
        data: {
          orgId: org!.id,
          email: resetEmail,
          name: testName,
          passwordHash,
          emailVerified: true,
          role: UserRole.MEMBER,
        },
      });

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: resetEmail, password: testPassword })
        .expect(200);

      const cookies = extractCookies(loginResponse);

      // Verify can access protected route
      await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${cookies.accessToken}`])
        .expect(200);

      // Reset password
      const resetToken = await createResetToken(resetEmail);
      await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword789!',
        })
        .expect(200);

      // Old session should be invalidated
      await request(app)
        .get('/v1/auth/me')
        .set('Cookie', [`access_token=${cookies.accessToken}`])
        .expect(401);

      // Should be able to login with new password
      await request(app)
        .post('/v1/auth/login')
        .send({ email: resetEmail, password: 'NewPassword789!' })
        .expect(200);
    });
  });
});
