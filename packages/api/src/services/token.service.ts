import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import type { UserRole } from '@prisma/client';

/**
 * Token payload structure for JWT access tokens
 */
export interface TokenPayload {
  sub: string;        // user ID
  orgId: string;      // organization ID
  role: UserRole;     // user role
  type: 'access';     // token type
  iat: number;        // issued at
  exp: number;        // expires at
}

/**
 * Token pair returned after generation
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Token Service
 * 
 * Handles JWT access token generation/verification and refresh token management.
 * Implements token rotation for enhanced security.
 */
export class TokenService {
  private readonly jwtSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly bcryptRounds = 12;

  constructor() {
    this.jwtSecret = env.JWT_SECRET;
    this.accessTokenExpiry = env.JWT_EXPIRES_IN;
    this.refreshTokenExpiry = env.REFRESH_TOKEN_EXPIRES_IN;
  }

  /**
   * Generates a JWT access token with HS256 algorithm
   * 
   * @param payload - Token payload containing user ID, org ID, and role
   * @returns Signed JWT access token (15-minute expiry)
   * 
   * Requirements: 5.1, 5.2, 5.3
   */
  generateAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string {
    const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      ...payload,
      type: 'access',
    };

    return jwt.sign(tokenPayload, this.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: this.accessTokenExpiry,
    } as jwt.SignOptions);
  }

  /**
   * Generates a cryptographically secure random refresh token
   * 
   * @returns 64-byte random hex string
   * 
   * Requirements: 5.4
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Verifies JWT access token signature and expiry
   * 
   * @param token - JWT access token to verify
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   * 
   * Requirements: 5.1, 5.2
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload;

      // Validate token type
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('INVALID_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Hashes a token using bcrypt with 12 rounds
   * 
   * @param token - Plain text token to hash
   * @returns Bcrypt hash of the token
   * 
   * Requirements: 5.5, 16.1
   */
  async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, this.bcryptRounds);
  }

  /**
   * Compares a plain text token with a bcrypt hash (constant-time)
   * 
   * @param token - Plain text token
   * @param hash - Bcrypt hash to compare against
   * @returns True if token matches hash, false otherwise
   * 
   * Requirements: 5.5, 16.10
   */
  async compareToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  /**
   * Rotates refresh token by validating old token and generating new pair
   * 
   * Implements atomic session revocation and creation for security.
   * 
   * @param oldToken - Current refresh token from cookie
   * @returns New access and refresh token pair
   * @throws Error if old token is invalid, revoked, or expired
   * 
   * Requirements: 6.6, 6.7, 6.8, 6.9
   */
  async rotateRefreshToken(oldToken: string): Promise<TokenPair> {
    // Hash the received token to find matching session
    const hashedOldToken = await this.hashToken(oldToken);

    // Find session by hashed refresh token
    const session = await prisma.session.findUnique({
      where: { refreshToken: hashedOldToken },
      include: {
        user: {
          select: {
            id: true,
            orgId: true,
            role: true,
          },
        },
      },
    });

    // Validate session exists
    if (!session) {
      throw new Error('INVALID_TOKEN');
    }

    // Validate session is not revoked
    if (session.revoked) {
      throw new Error('INVALID_TOKEN');
    }

    // Validate session is not expired
    if (session.expiresAt < new Date()) {
      throw new Error('TOKEN_EXPIRED');
    }

    // Generate new token pair
    const newAccessToken = this.generateAccessToken({
      sub: session.user.id,
      orgId: session.user.orgId,
      role: session.user.role,
    });

    const newRefreshToken = this.generateRefreshToken();
    const hashedNewRefreshToken = await this.hashToken(newRefreshToken);

    // Calculate new expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Atomic operation: revoke old session and create new one
    await prisma.$transaction([
      // Revoke old session
      prisma.session.update({
        where: { id: session.id },
        data: { revoked: true },
      }),
      // Create new session
      prisma.session.create({
        data: {
          userId: session.userId,
          refreshToken: hashedNewRefreshToken,
          deviceInfo: session.deviceInfo as any,
          expiresAt,
        },
      }),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

// Export singleton instance
export const tokenService = new TokenService();
