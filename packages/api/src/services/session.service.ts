import { prisma } from '../config/prisma.js';
import type { Session } from '@prisma/client';

/**
 * Device information extracted from request
 */
export interface DeviceInfo {
  userAgent: string;
  ip: string;
  browser?: string;
  os?: string;
  deviceType?: string;
}

/**
 * Input for creating a new session
 */
export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  deviceInfo: DeviceInfo;
  expiresAt: Date;
}

/**
 * Session with current session flag for listing
 */
export interface SessionWithCurrent extends Session {
  isCurrent?: boolean;
}

/**
 * Session Service
 * 
 * Handles session CRUD operations, device tracking, and session revocation.
 * Supports multi-device session management with remote revocation.
 */
export class SessionService {
  /**
   * Creates a new session record with device info and expiry
   * 
   * @param data - Session creation data
   * @returns Created session record
   * 
   * Requirements: 9.1, 9.2
   */
  async createSession(data: CreateSessionInput): Promise<Session> {
    return prisma.session.create({
      data: {
        userId: data.userId,
        refreshToken: data.refreshTokenHash,
        deviceInfo: data.deviceInfo as any,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Finds a session by hashed refresh token
   * 
   * Validates that session is not revoked and not expired.
   * 
   * @param refreshTokenHash - Hashed refresh token to search for
   * @returns Session record if valid, null otherwise
   * 
   * Requirements: 9.1, 9.2
   */
  async findSession(refreshTokenHash: string): Promise<Session | null> {
    const session = await prisma.session.findUnique({
      where: { refreshToken: refreshTokenHash },
    });

    // Return null if session doesn't exist
    if (!session) {
      return null;
    }

    // Return null if session is revoked
    if (session.revoked) {
      return null;
    }

    // Return null if session is expired
    if (session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  /**
   * Finds all non-revoked sessions for a user
   * 
   * @param userId - User ID to find sessions for
   * @returns Array of active sessions
   * 
   * Requirements: 9.1, 9.2
   */
  async findUserSessions(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Revokes a specific session by setting revoked flag to true
   * 
   * @param sessionId - Session ID to revoke
   * 
   * Requirements: 9.5
   */
  async revokeSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revoked: true },
    });
  }

  /**
   * Revokes all sessions for a user (bulk revocation)
   * 
   * Used when password is reset for security.
   * 
   * @param userId - User ID to revoke all sessions for
   * @returns Number of sessions revoked
   * 
   * Requirements: 9.6
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    return result.count;
  }

  /**
   * Cleans up expired sessions (background job)
   * 
   * Deletes sessions where:
   * - expiresAt is in the past, OR
   * - revoked is true AND createdAt is more than 30 days ago
   * 
   * @returns Number of sessions deleted
   * 
   * Requirements: Session management
   */
  async cleanExpiredSessions(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          // Delete expired sessions
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          // Delete old revoked sessions
          {
            revoked: true,
            createdAt: {
              lt: thirtyDaysAgo,
            },
          },
        ],
      },
    });

    return result.count;
  }

  /**
   * Finds a session by ID
   * 
   * @param sessionId - Session ID to find
   * @returns Session record if found, null otherwise
   */
  async findSessionById(sessionId: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { id: sessionId },
    });
  }

  /**
   * Checks if a session belongs to a specific user
   * 
   * @param sessionId - Session ID to check
   * @param userId - User ID to verify ownership
   * @returns True if session belongs to user, false otherwise
   */
  async isSessionOwnedByUser(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.findSessionById(sessionId);
    return session?.userId === userId;
  }
}

// Export singleton instance
export const sessionService = new SessionService();
