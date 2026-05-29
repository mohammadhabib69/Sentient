import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionService } from '../session.service.js';
import { prisma } from '../../config/prisma.js';
import type { Session } from '@prisma/client';

// Mock dependencies
vi.mock('../../config/prisma.js', () => ({
  prisma: {
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    sessionService = new SessionService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSession', () => {
    it('should create session with device info and expiry', async () => {
      const input = {
        userId: 'user-123',
        refreshTokenHash: 'hashed-token-abc',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1',
          browser: 'Chrome',
          os: 'macOS',
          deviceType: 'Desktop',
        },
        expiresAt: new Date('2026-06-15T00:00:00Z'),
      };

      const mockSession: Session = {
        id: 'session-123',
        userId: input.userId,
        refreshToken: input.refreshTokenHash,
        deviceInfo: input.deviceInfo as any,
        expiresAt: input.expiresAt,
        revoked: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.session.create).mockResolvedValue(mockSession);

      const result = await sessionService.createSession(input);

      expect(result).toEqual(mockSession);
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: input.userId,
          refreshToken: input.refreshTokenHash,
          deviceInfo: input.deviceInfo,
          expiresAt: input.expiresAt,
        },
      });
    });

    it('should store hashed refresh token', async () => {
      const input = {
        userId: 'user-123',
        refreshTokenHash: '$2a$12$hashedtoken',
        deviceInfo: {
          userAgent: 'test',
          ip: '127.0.0.1',
        },
        expiresAt: new Date(),
      };

      const mockSession: Session = {
        id: 'session-123',
        userId: input.userId,
        refreshToken: input.refreshTokenHash,
        deviceInfo: input.deviceInfo as any,
        expiresAt: input.expiresAt,
        revoked: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.session.create).mockResolvedValue(mockSession);

      await sessionService.createSession(input);

      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refreshToken: input.refreshTokenHash,
          }),
        })
      );
    });
  });

  describe('findSession', () => {
    it('should return session if valid (not revoked, not expired)', async () => {
      const mockSession: Session = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'hashed-token',
        deviceInfo: {} as any,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days future
        revoked: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);

      const result = await sessionService.findSession('hashed-token');

      expect(result).toEqual(mockSession);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { refreshToken: 'hashed-token' },
      });
    });

    it('should return null if session does not exist', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const result = await sessionService.findSession('non-existent-token');

      expect(result).toBeNull();
    });

    it('should return null if session is revoked', async () => {
      const mockSession: Session = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'hashed-token',
        deviceInfo: {} as any,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revoked: true, // Revoked
        createdAt: new Date(),
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);

      const result = await sessionService.findSession('hashed-token');

      expect(result).toBeNull();
    });

    it('should return null if session is expired', async () => {
      const mockSession: Session = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'hashed-token',
        deviceInfo: {} as any,
        expiresAt: new Date(Date.now() - 1000), // Expired (past)
        revoked: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);

      const result = await sessionService.findSession('hashed-token');

      expect(result).toBeNull();
    });
  });

  describe('findUserSessions', () => {
    it('should return all non-revoked, non-expired sessions for user', async () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          userId: 'user-123',
          refreshToken: 'token-1',
          deviceInfo: { userAgent: 'Chrome', ip: '192.168.1.1' } as any,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          revoked: false,
          createdAt: new Date('2026-05-01'),
        },
        {
          id: 'session-2',
          userId: 'user-123',
          refreshToken: 'token-2',
          deviceInfo: { userAgent: 'Firefox', ip: '192.168.1.2' } as any,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          revoked: false,
          createdAt: new Date('2026-05-02'),
        },
      ];

      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions);

      const result = await sessionService.findUserSessions('user-123');

      expect(result).toEqual(mockSessions);
      expect(prisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          revoked: false,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array if user has no active sessions', async () => {
      vi.mocked(prisma.session.findMany).mockResolvedValue([]);

      const result = await sessionService.findUserSessions('user-123');

      expect(result).toEqual([]);
    });

    it('should order sessions by createdAt descending', async () => {
      const mockSessions: Session[] = [
        {
          id: 'session-2',
          userId: 'user-123',
          refreshToken: 'token-2',
          deviceInfo: {} as any,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          revoked: false,
          createdAt: new Date('2026-05-02'), // Newer
        },
        {
          id: 'session-1',
          userId: 'user-123',
          refreshToken: 'token-1',
          deviceInfo: {} as any,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          revoked: false,
          createdAt: new Date('2026-05-01'), // Older
        },
      ];

      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions);

      const result = await sessionService.findUserSessions('user-123');

      expect(result[0].createdAt > result[1].createdAt).toBe(true);
    });
  });

  describe('revokeSession', () => {
    it('should set revoked flag to true for specific session', async () => {
      const mockSession: Session = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'token',
        deviceInfo: {} as any,
        expiresAt: new Date(),
        revoked: true,
        createdAt: new Date(),
      };

      vi.mocked(prisma.session.update).mockResolvedValue(mockSession);

      await sessionService.revokeSession('session-123');

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { revoked: true },
      });
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all non-revoked sessions for user', async () => {
      vi.mocked(prisma.session.updateMany).mockResolvedValue({ count: 3 });

      const result = await sessionService.revokeAllUserSessions('user-123');

      expect(result).toBe(3);
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          revoked: false,
        },
        data: {
          revoked: true,
        },
      });
    });

    it('should return 0 if user has no active sessions', async () => {
      vi.mocked(prisma.session.updateMany).mockResolvedValue({ count: 0 });

      const result = await sessionService.revokeAllUserSessions('user-123');

      expect(result).toBe(0);
    });

    it('should only revoke non-revoked sessions', async () => {
      vi.mocked(prisma.session.updateMany).mockResolvedValue({ count: 2 });

      await sessionService.revokeAllUserSessions('user-123');

      expect(prisma.session.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            revoked: false,
          }),
        })
      );
    });
  });

  describe('cleanExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 5 });

      const result = await sessionService.cleanExpiredSessions();

      expect(result).toBe(5);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              expiresAt: {
                lt: expect.any(Date),
              },
            },
            {
              revoked: true,
              createdAt: {
                lt: expect.any(Date),
              },
            },
          ],
        },
      });
    });

    it('should delete old revoked sessions (>30 days)', async () => {
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 3 });

      await sessionService.cleanExpiredSessions();

      const call = vi.mocked(prisma.session.deleteMany).mock.calls[0][0];
      const orConditions = call?.where?.OR;

      expect(orConditions).toBeDefined();
      expect(orConditions).toHaveLength(2);

      // Check second condition (old revoked sessions)
      const revokedCondition = orConditions?.[1];
      expect(revokedCondition).toMatchObject({
        revoked: true,
        createdAt: {
          lt: expect.any(Date),
        },
      });
    });

    it('should return 0 if no sessions to clean', async () => {
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 0 });

      const result = await sessionService.cleanExpiredSessions();

      expect(result).toBe(0);
    });
  });

  describe('findSessionById', () => {
    it('should return session if found', async () => {
      const mockSession: Session = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'token',
        deviceInfo: {} as any,
        expiresAt: new Date(),
        revoked: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);

      const result = await sessionService.findSessionById('session-123');

      expect(result).toEqual(mockSession);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
      });
    });

    it('should return null if session not found', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const result = await sessionService.findSessionById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('isSessionOwnedByUser', () => {
    it('should return true if session belongs to user', async () => {
      const mockSession: Session = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'token',
        deviceInfo: {} as any,
        expiresAt: new Date(),
        revoked: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);

      const result = await sessionService.isSessionOwnedByUser('session-123', 'user-123');

      expect(result).toBe(true);
    });

    it('should return false if session belongs to different user', async () => {
      const mockSession: Session = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'token',
        deviceInfo: {} as any,
        expiresAt: new Date(),
        revoked: false,
        createdAt: new Date(),
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);

      const result = await sessionService.isSessionOwnedByUser('session-123', 'user-456');

      expect(result).toBe(false);
    });

    it('should return false if session not found', async () => {
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const result = await sessionService.isSessionOwnedByUser('non-existent', 'user-123');

      expect(result).toBe(false);
    });
  });
});
