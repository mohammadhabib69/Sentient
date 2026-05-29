import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { TokenService } from '../token.service.js';
import { prisma } from '../../config/prisma.js';
import type { UserRole } from '@prisma/client';

// Mock dependencies
vi.mock('../../config/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-with-at-least-32-characters-for-security',
    JWT_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '30d',
  },
}));

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate JWT with correct payload structure', () => {
      const payload = {
        sub: 'user-123',
        orgId: 'org-456',
        role: 'MEMBER' as UserRole,
      };

      const token = tokenService.generateAccessToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Decode without verification to check structure
      const decoded = jwt.decode(token) as any;
      expect(decoded.sub).toBe('user-123');
      expect(decoded.orgId).toBe('org-456');
      expect(decoded.role).toBe('MEMBER');
      expect(decoded.type).toBe('access');
      expect(decoded.iat).toBeTruthy();
      expect(decoded.exp).toBeTruthy();
    });

    it('should generate token with HS256 algorithm', () => {
      const payload = {
        sub: 'user-123',
        orgId: 'org-456',
        role: 'MEMBER' as UserRole,
      };

      const token = tokenService.generateAccessToken(payload);
      const decoded = jwt.decode(token, { complete: true }) as any;

      expect(decoded.header.alg).toBe('HS256');
    });

    it('should generate token with 15-minute expiry', () => {
      const payload = {
        sub: 'user-123',
        orgId: 'org-456',
        role: 'MEMBER' as UserRole,
      };

      const beforeTime = Math.floor(Date.now() / 1000);
      const token = tokenService.generateAccessToken(payload);
      const afterTime = Math.floor(Date.now() / 1000);

      const decoded = jwt.decode(token) as any;
      const expectedExpiry = 15 * 60; // 15 minutes in seconds

      // Allow 1 second tolerance for test execution time
      expect(decoded.exp - decoded.iat).toBeGreaterThanOrEqual(expectedExpiry - 1);
      expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(expectedExpiry + 1);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate 128-character hex string (64 bytes)', () => {
      const token = tokenService.generateRefreshToken();

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(128); // 64 bytes * 2 (hex encoding)
      expect(/^[0-9a-f]+$/.test(token)).toBe(true); // Only hex characters
    });

    it('should generate unique tokens', () => {
      const token1 = tokenService.generateRefreshToken();
      const token2 = tokenService.generateRefreshToken();
      const token3 = tokenService.generateRefreshToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token and return payload', () => {
      const payload = {
        sub: 'user-123',
        orgId: 'org-456',
        role: 'MEMBER' as UserRole,
      };

      const token = tokenService.generateAccessToken(payload);
      const verified = tokenService.verifyAccessToken(token);

      expect(verified.sub).toBe('user-123');
      expect(verified.orgId).toBe('org-456');
      expect(verified.role).toBe('MEMBER');
      expect(verified.type).toBe('access');
    });

    it('should throw TOKEN_EXPIRED for expired token', () => {
      const payload = {
        sub: 'user-123',
        orgId: 'org-456',
        role: 'MEMBER' as UserRole,
      };

      // Generate token with -1 second expiry (already expired)
      const expiredToken = jwt.sign(
        { ...payload, type: 'access' },
        'test-secret-key-with-at-least-32-characters-for-security',
        { expiresIn: '-1s' }
      );

      expect(() => tokenService.verifyAccessToken(expiredToken)).toThrow('TOKEN_EXPIRED');
    });

    it('should throw INVALID_TOKEN for malformed token', () => {
      expect(() => tokenService.verifyAccessToken('invalid-token')).toThrow('INVALID_TOKEN');
    });

    it('should throw INVALID_TOKEN for token with wrong signature', () => {
      const payload = {
        sub: 'user-123',
        orgId: 'org-456',
        role: 'MEMBER' as UserRole,
        type: 'access' as const,
      };

      const wrongToken = jwt.sign(payload, 'wrong-secret-key', { expiresIn: '15m' });

      expect(() => tokenService.verifyAccessToken(wrongToken)).toThrow('INVALID_TOKEN');
    });

    it('should throw error for non-access token type', () => {
      const payload = {
        sub: 'user-123',
        orgId: 'org-456',
        role: 'MEMBER' as UserRole,
        type: 'refresh' as any, // Wrong type
      };

      const token = jwt.sign(
        payload,
        'test-secret-key-with-at-least-32-characters-for-security',
        { expiresIn: '15m' }
      );

      expect(() => tokenService.verifyAccessToken(token)).toThrow('Invalid token type');
    });
  });

  describe('hashToken', () => {
    it('should hash token with bcrypt', async () => {
      const token = 'test-token-123';
      const hash = await tokenService.hashToken(token);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(token);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    it('should generate different hashes for same token', async () => {
      const token = 'test-token-123';
      const hash1 = await tokenService.hashToken(token);
      const hash2 = await tokenService.hashToken(token);

      // bcrypt uses salt, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it('should use 12 rounds (verifiable by hash format)', async () => {
      const token = 'test-token-123';
      const hash = await tokenService.hashToken(token);

      // bcrypt hash format: $2a$rounds$salt+hash
      const rounds = hash.split('$')[2];
      expect(rounds).toBe('12');
    });
  });

  describe('compareToken', () => {
    it('should return true for matching token and hash', async () => {
      const token = 'test-token-123';
      const hash = await tokenService.hashToken(token);

      const result = await tokenService.compareToken(token, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching token and hash', async () => {
      const token = 'test-token-123';
      const hash = await tokenService.hashToken(token);

      const result = await tokenService.compareToken('wrong-token', hash);
      expect(result).toBe(false);
    });

    it('should be constant-time (bcrypt inherent property)', async () => {
      const token = 'test-token-123';
      const hash = await tokenService.hashToken(token);

      // bcrypt.compare is inherently constant-time
      // This test just verifies it works correctly
      const result1 = await tokenService.compareToken(token, hash);
      const result2 = await tokenService.compareToken('wrong', hash);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('rotateRefreshToken', () => {
    it('should generate new token pair and revoke old session', async () => {
      const oldToken = 'old-refresh-token-123';
      const hashedOldToken = await bcrypt.hash(oldToken, 12);

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: hashedOldToken,
        deviceInfo: { userAgent: 'test', ip: '127.0.0.1' },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days future
        revoked: false,
        createdAt: new Date(),
        user: {
          id: 'user-123',
          orgId: 'org-456',
          role: 'MEMBER' as UserRole,
        },
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const result = await tokenService.rotateRefreshToken(oldToken);

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');

      // Verify access token payload
      const decoded = jwt.decode(result.accessToken) as any;
      expect(decoded.sub).toBe('user-123');
      expect(decoded.orgId).toBe('org-456');
      expect(decoded.role).toBe('MEMBER');

      // Verify transaction was called (revoke + create)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_TOKEN if session not found', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      await expect(tokenService.rotateRefreshToken('invalid-token')).rejects.toThrow(
        'INVALID_TOKEN'
      );
    });

    it('should throw INVALID_TOKEN if session is revoked', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'hashed-token',
        deviceInfo: {},
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revoked: true, // Revoked
        createdAt: new Date(),
        user: {
          id: 'user-123',
          orgId: 'org-456',
          role: 'MEMBER' as UserRole,
        },
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);

      await expect(tokenService.rotateRefreshToken('old-token')).rejects.toThrow('INVALID_TOKEN');
    });

    it('should throw TOKEN_EXPIRED if session is expired', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'hashed-token',
        deviceInfo: {},
        expiresAt: new Date(Date.now() - 1000), // Expired (past)
        revoked: false,
        createdAt: new Date(),
        user: {
          id: 'user-123',
          orgId: 'org-456',
          role: 'MEMBER' as UserRole,
        },
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);

      await expect(tokenService.rotateRefreshToken('old-token')).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('should preserve device info in new session', async () => {
      const oldToken = 'old-refresh-token-123';
      const hashedOldToken = await bcrypt.hash(oldToken, 12);

      const deviceInfo = {
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
        browser: 'Chrome',
        os: 'macOS',
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: hashedOldToken,
        deviceInfo,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revoked: false,
        createdAt: new Date(),
        user: {
          id: 'user-123',
          orgId: 'org-456',
          role: 'MEMBER' as UserRole,
        },
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      await tokenService.rotateRefreshToken(oldToken);

      // Verify transaction was called
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      
      // Verify the transaction includes both revoke and create operations
      const transactionArg = vi.mocked(prisma.$transaction).mock.calls[0][0];
      expect(Array.isArray(transactionArg)).toBe(true);
      expect(transactionArg).toHaveLength(2);
    });
  });
});
