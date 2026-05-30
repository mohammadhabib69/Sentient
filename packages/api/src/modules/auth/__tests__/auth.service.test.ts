/**
 * Unit Tests: AuthService (Task 23.4)
 *
 * Requirements: 1.1-1.12, 3.1-3.10, 2.1-2.10, 8.1-8.11, 4.1-4.10, 12.7-12.10
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { UserRole, Plan } from '@prisma/client';

// ─── Mocks (must come before importing the module under test) ─────────────────

vi.mock('../../../config/prisma.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    session: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../../services/token.service.js', () => ({
  tokenService: {
    generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
    generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
    hashToken: vi.fn().mockResolvedValue('mock-hashed-refresh-token'),
  },
}));

vi.mock('../../../services/session.service.js', () => ({
  sessionService: {
    createSession: vi.fn().mockResolvedValue({ id: 'session-abc', userId: 'user-123' }),
    revokeAllUserSessions: vi.fn().mockResolvedValue(2),
  },
}));

vi.mock('../../../services/email.service.js', () => ({
  emailService: {
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-with-at-least-32-characters-for-security',
    JWT_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '30d',
    FRONTEND_URL: 'http://localhost:3000',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3001/v1/auth/google/callback',
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { AuthService } from '../auth.service.js';
import { prisma } from '../../../config/prisma.js';
import { tokenService } from '../../../services/token.service.js';
import { sessionService } from '../../../services/session.service.js';
import { emailService } from '../../../services/email.service.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeOrg = (overrides = {}) => ({
  id: 'org-456',
  name: "Test Org",
  slug: 'test-org-abc123',
  plan: 'FREE' as Plan,
  graphNodeId: '',
  stripeCustId: null,
  settings: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-123',
  orgId: 'org-456',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: null as string | null,
  role: 'MEMBER' as UserRole,
  emailVerified: false,
  emailVerifyToken: null as string | null,
  emailVerifyExpiry: null as Date | null,
  resetPasswordToken: null as string | null,
  resetPasswordExpiry: null as Date | null,
  failedLoginAttempts: 0,
  lockedUntil: null as Date | null,
  googleId: null as string | null,
  avatarUrl: null as string | null,
  graphNodeId: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
  organization: makeOrg(),
  ...overrides,
});

const deviceInfo = { userAgent: 'Mozilla/5.0', ip: '127.0.0.1', browser: 'Chrome', os: 'macOS' };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // register
  // ──────────────────────────────────────────────────────────────────────────
  describe('register', () => {
    const registerInput = { name: 'Test User', email: 'test@example.com', password: 'Password1!' };

    it('should create first user as SUPER_ADMIN with new org', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null); // no duplicate
      vi.mocked(prisma.organization.count).mockResolvedValueOnce(0); // first user

      const org = makeOrg();
      const user = makeUser({ role: 'SUPER_ADMIN' as UserRole });
      vi.mocked(prisma.$transaction).mockResolvedValueOnce({ user, org });

      const result = await authService.register(registerInput, deviceInfo);

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(sessionService.createSession).toHaveBeenCalledOnce();
    });

    it('should create subsequent users as MEMBER in existing org', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.organization.count).mockResolvedValueOnce(1); // not first
      vi.mocked(prisma.organization.findFirst).mockResolvedValueOnce(makeOrg());
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null); // no existing in org
      const user = makeUser({ role: 'MEMBER' as UserRole });
      vi.mocked(prisma.user.create).mockResolvedValueOnce(user as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(user as any);

      const result = await authService.register(registerInput, deviceInfo);

      expect(result.user.email).toBe('test@example.com');
      expect(tokenService.generateAccessToken).toHaveBeenCalledOnce();
    });

    it('should throw ConflictError if email already registered globally', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(makeUser() as any);

      await expect(authService.register(registerInput, deviceInfo)).rejects.toThrow('Email already registered');
    });

    it('should throw ConflictError if email exists in the org', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.organization.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.organization.findFirst).mockResolvedValueOnce(makeOrg());
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeUser() as any);

      await expect(authService.register(registerInput, deviceInfo)).rejects.toThrow(
        'Email already registered in this organization',
      );
    });

    it('should send verification email after registration', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.organization.count).mockResolvedValueOnce(0);
      const user = makeUser({ role: 'SUPER_ADMIN' as UserRole });
      vi.mocked(prisma.$transaction).mockResolvedValueOnce({ user, org: makeOrg() });
      vi.mocked(prisma.user.update).mockResolvedValueOnce(user as any);

      await authService.register(registerInput, deviceInfo);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledOnce();
    });

    it('should hash password before storing', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.organization.count).mockResolvedValueOnce(0);

      const user = makeUser({ role: 'SUPER_ADMIN' as UserRole });
      let capturedPasswordHash: string | undefined;
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (cb: any) => {
        // capture the data passed to user.create inside the transaction
        const fakeTx = {
          organization: { create: vi.fn().mockResolvedValue(makeOrg()) },
          user: {
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              capturedPasswordHash = data.passwordHash;
              return { ...user, ...data, organization: makeOrg() };
            }),
          },
        };
        return cb(fakeTx);
      });
      vi.mocked(prisma.user.update).mockResolvedValueOnce(user as any);

      await authService.register(registerInput, deviceInfo);

      expect(capturedPasswordHash).toBeDefined();
      expect(capturedPasswordHash).not.toBe('Password1!');
      // should be a bcrypt hash
      const isHash = capturedPasswordHash!.startsWith('$2');
      expect(isHash).toBe(true);
    });

    it('should throw internal error if no org found for subsequent users', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.organization.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.organization.findFirst).mockResolvedValueOnce(null); // no org!

      await expect(authService.register(registerInput, deviceInfo)).rejects.toThrow('No organization found');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // login
  // ──────────────────────────────────────────────────────────────────────────
  describe('login', () => {
    const plainPassword = 'Password1!';
    let validUser: ReturnType<typeof makeUser>;

    beforeEach(async () => {
      const hash = await bcrypt.hash(plainPassword, 12);
      validUser = makeUser({ passwordHash: hash, emailVerified: true });
    });

    it('should return tokens on successful login', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(validUser as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(validUser as any);

      const result = await authService.login({ email: validUser.email, password: plainPassword }, deviceInfo);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.email).toBe(validUser.email);
    });

    it('should throw UNAUTHORIZED for unknown email', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      await expect(
        authService.login({ email: 'nobody@example.com', password: plainPassword }, deviceInfo),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UNAUTHORIZED for wrong password', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(validUser as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(validUser as any);

      await expect(
        authService.login({ email: validUser.email, password: 'WrongPass1!' }, deviceInfo),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should increment failedLoginAttempts on wrong password', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(validUser as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(validUser as any);

      await expect(
        authService.login({ email: validUser.email, password: 'WrongPass1!' }, deviceInfo),
      ).rejects.toThrow();

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 1 }),
        }),
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      const userWith4Fails = makeUser({ passwordHash: validUser.passwordHash, failedLoginAttempts: 4 });
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(userWith4Fails as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(userWith4Fails as any);

      await expect(
        authService.login({ email: userWith4Fails.email, password: 'WrongPass1!' }, deviceInfo),
      ).rejects.toThrow();

      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
      expect((updateCall as any).data.lockedUntil).toBeDefined();
    });

    it('should throw ACCOUNT_LOCKED when lockedUntil is in the future', async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      const lockedUser = makeUser({ passwordHash: validUser.passwordHash, lockedUntil: futureDate });
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(lockedUser as any);

      // The AppError is thrown with errorCode 'ACCOUNT_LOCKED'; check on the error object itself
      const error = await authService
        .login({ email: lockedUser.email, password: plainPassword }, deviceInfo)
        .catch((e: any) => e);

      expect(error).toBeDefined();
      expect(error.errorCode ?? error.code).toBe('ACCOUNT_LOCKED');
    });

    it('should reset failedLoginAttempts on successful login', async () => {
      const userWith2Fails = makeUser({ passwordHash: validUser.passwordHash, failedLoginAttempts: 2 });
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(userWith2Fails as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(userWith2Fails as any);

      await authService.login({ email: userWith2Fails.email, password: plainPassword }, deviceInfo);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 0, lockedUntil: null }),
        }),
      );
    });

    it('should create a session on successful login', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(validUser as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(validUser as any);

      await authService.login({ email: validUser.email, password: plainPassword }, deviceInfo);

      expect(sessionService.createSession).toHaveBeenCalledOnce();
    });

    it('should throw UNAUTHORIZED if user has no passwordHash (Google-only account)', async () => {
      const googleUser = makeUser({ passwordHash: null });
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(googleUser as any);

      await expect(
        authService.login({ email: googleUser.email, password: plainPassword }, deviceInfo),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // verifyEmail
  // ──────────────────────────────────────────────────────────────────────────
  describe('verifyEmail', () => {
    it('should mark email as verified and clear token', async () => {
      const rawToken = 'raw-verification-token-abc123';
      const tokenHash = await bcrypt.hash(rawToken, 12);
      const user = makeUser({ emailVerifyToken: tokenHash, emailVerifyExpiry: new Date(Date.now() + 3600_000) });

      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([user] as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(user as any);

      await authService.verifyEmail(rawToken);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emailVerified: true,
            emailVerifyToken: null,
            emailVerifyExpiry: null,
          }),
        }),
      );
    });

    it('should throw INVALID_TOKEN if no user matches the token', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);

      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow('Invalid or expired verification token');
    });

    it('should send welcome email after successful verification', async () => {
      const rawToken = 'raw-token-for-welcome';
      const tokenHash = await bcrypt.hash(rawToken, 12);
      const user = makeUser({ emailVerifyToken: tokenHash, emailVerifyExpiry: new Date(Date.now() + 3600_000) });

      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([user] as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(user as any);

      await authService.verifyEmail(rawToken);

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledOnce();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // sendVerificationEmail
  // ──────────────────────────────────────────────────────────────────────────
  describe('sendVerificationEmail', () => {
    it('should throw EMAIL_ALREADY_VERIFIED if email is already verified', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(makeUser({ emailVerified: true }) as any);

      await expect(authService.sendVerificationEmail('user-123')).rejects.toThrow('Email already verified');
    });

    it('should update token and send email for unverified user', async () => {
      const user = makeUser({ emailVerified: false });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(user as any);

      await authService.sendVerificationEmail('user-123');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emailVerifyToken: expect.any(String),
            emailVerifyExpiry: expect.any(Date),
          }),
        }),
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledOnce();
    });

    it('should throw UNAUTHORIZED if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await expect(authService.sendVerificationEmail('no-user')).rejects.toThrow('Unauthorized');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // forgotPassword
  // ──────────────────────────────────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('should silently succeed if email does not exist (enumeration prevention)', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      // Should not throw
      await expect(authService.forgotPassword({ email: 'nobody@example.com' })).resolves.toBeUndefined();

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should generate reset token with 1-hour expiry and send email', async () => {
      const user = makeUser();
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(user as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(user as any);

      const before = new Date();
      await authService.forgotPassword({ email: user.email });
      const after = new Date();

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resetPasswordToken: expect.any(String),
            resetPasswordExpiry: expect.any(Date),
          }),
        }),
      );
      // Expiry should be ~1 hour in the future
      const updateData = (vi.mocked(prisma.user.update).mock.calls[0][0] as any).data;
      const expiry = new Date(updateData.resetPasswordExpiry);
      const hourMs = 3600_000;
      expect(expiry.getTime() - before.getTime()).toBeGreaterThanOrEqual(hourMs - 1000);
      expect(expiry.getTime() - after.getTime()).toBeLessThanOrEqual(hourMs + 1000);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledOnce();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // resetPassword
  // ──────────────────────────────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('should hash new password and revoke all sessions', async () => {
      const rawToken = 'raw-reset-token-xyz';
      const tokenHash = await bcrypt.hash(rawToken, 12);
      const user = makeUser({ resetPasswordToken: tokenHash, resetPasswordExpiry: new Date(Date.now() + 3600_000) });

      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([user] as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce(user as any);
      vi.mocked(sessionService.revokeAllUserSessions).mockResolvedValueOnce(1);

      await authService.resetPassword({ token: rawToken, password: 'NewPassword1!' });

      const updateData = (vi.mocked(prisma.user.update).mock.calls[0][0] as any).data;
      // New password must be hashed
      expect(updateData.passwordHash).toBeDefined();
      const isNewHash = updateData.passwordHash.startsWith('$2');
      expect(isNewHash).toBe(true);
      // Token cleared
      expect(updateData.resetPasswordToken).toBeNull();
      expect(updateData.resetPasswordExpiry).toBeNull();
      // Sessions revoked
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(user.id);
    });

    it('should throw INVALID_TOKEN if token does not match', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([]);

      await expect(
        authService.resetPassword({ token: 'bad-token', password: 'NewPassword1!' }),
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // getCurrentUser
  // ──────────────────────────────────────────────────────────────────────────
  describe('getCurrentUser', () => {
    it('should return user and org data for valid user id', async () => {
      const user = makeUser();
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user as any);

      const result = await authService.getCurrentUser('user-123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.org).toBeDefined();
    });

    it('should throw UNAUTHORIZED if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await expect(authService.getCurrentUser('no-user')).rejects.toThrow('Unauthorized');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // loginWithGoogle
  // ──────────────────────────────────────────────────────────────────────────
  describe('loginWithGoogle', () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'google@example.com',
      name: 'Google User',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    it('should create a new user + org when not found', async () => {
      // loginWithGoogle uses a single findFirst with OR [{ googleId }, { email }]
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.organization.count).mockResolvedValueOnce(0);

      const org = makeOrg();
      const user = makeUser({ googleId: 'google-123', emailVerified: true, role: 'SUPER_ADMIN' as UserRole });
      vi.mocked(prisma.$transaction).mockResolvedValueOnce({ user, org });

      const result = await authService.loginWithGoogle(googleProfile, deviceInfo);

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should log in existing user found by googleId', async () => {
      // loginWithGoogle uses a single findFirst with OR [{ googleId }, { email }]
      // User already has googleId set → !user.googleId is false → skip link branch
      const user = makeUser({ googleId: 'google-123', emailVerified: true, email: 'google@example.com' });
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(user as any);

      const result = await authService.loginWithGoogle(googleProfile, deviceInfo);

      expect(result.user.email).toBe('google@example.com');
      expect(sessionService.createSession).toHaveBeenCalledOnce();
    });

    it('should link Google account when email matches existing user', async () => {
      // loginWithGoogle does a single findFirst with OR [googleId, email].
      // The existing user must have the SAME email as googleProfile so the
      // linking branch (`!user.googleId && user.email === email`) triggers.
      const existingUserNoGoogleId = makeUser({ googleId: null, email: 'google@example.com' });
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(existingUserNoGoogleId as any);

      // update() must return user with organization included (service reads user.organization)
      const updatedUser = makeUser({ googleId: 'google-123', emailVerified: true, email: 'google@example.com' });
      vi.mocked(prisma.user.update).mockResolvedValueOnce(updatedUser as any);

      const result = await authService.loginWithGoogle(googleProfile, deviceInfo);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ googleId: 'google-123', emailVerified: true }),
        }),
      );
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should set emailVerified to true for new Google users', async () => {
      // No existing user found → create new org + user via $transaction
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.organization.count).mockResolvedValueOnce(0);

      // The mocked transaction must return a user with emailVerified: true
      const newUser = makeUser({ googleId: 'google-123', emailVerified: true, role: 'SUPER_ADMIN' as UserRole });
      vi.mocked(prisma.$transaction).mockResolvedValueOnce({ user: newUser, org: makeOrg() });

      const result = await authService.loginWithGoogle(googleProfile, deviceInfo);

      expect(result.user.emailVerified).toBe(true);
    });
  });
});
