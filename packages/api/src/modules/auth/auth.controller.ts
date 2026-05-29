import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { tokenService } from '../../services/token.service.js';
import { sessionService } from '../../services/session.service.js';
import { extractDeviceInfo } from '../../utils/device-info.js';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  verifyEmailSchema,
  revokeSessionSchema,
} from './auth.schema.js';
import { toSessionResponse } from './auth.types.js';
import { ValidationError, UnauthorizedError, AppError } from '../../utils/errors.js';
import { env } from '../../config/env.js';

/**
 * Cookie configuration for access token
 * 
 * Requirements: 5.7
 */
const accessTokenCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

/**
 * Cookie configuration for refresh token
 * 
 * Requirements: 5.8
 */
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/v1/auth',
};

/**
 * Auth Controller
 * 
 * Handles HTTP request/response for authentication endpoints.
 * Validates input, calls service methods, sets cookies, and formats responses.
 */
export class AuthController {
  /**
   * POST /v1/auth/register
   * 
   * Registers a new user with email and password
   * 
   * Requirements: 1.1-1.12
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors: Record<string, string[]> = {};
        validationResult.error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        throw new ValidationError(errors);
      }

      const data = validationResult.data;
      const deviceInfo = extractDeviceInfo(req);

      // Call service
      const result = await authService.register(data, deviceInfo);

      // Set HTTP-only cookies
      // Requirements: 1.11, 5.7, 5.8
      res.cookie('access_token', result.accessToken, accessTokenCookieOptions);
      res.cookie('refresh_token', result.refreshToken, refreshTokenCookieOptions);

      // Return user and org data (exclude tokens from body)
      // Requirements: 1.12
      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          org: result.org,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/auth/login
   * 
   * Authenticates user with email and password
   * 
   * Requirements: 3.1-3.10
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors: Record<string, string[]> = {};
        validationResult.error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        throw new ValidationError(errors);
      }

      const data = validationResult.data;
      const deviceInfo = extractDeviceInfo(req);

      // Call service
      const result = await authService.login(data, deviceInfo);

      // Set HTTP-only cookies
      // Requirements: 3.9
      res.cookie('access_token', result.accessToken, accessTokenCookieOptions);
      res.cookie('refresh_token', result.refreshToken, refreshTokenCookieOptions);

      // Return user and org data
      // Requirements: 3.10
      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          org: result.org,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/auth/refresh
   * 
   * Refreshes access token using refresh token
   * 
   * Requirements: 6.1-6.10
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Read refresh token from cookie
      // Requirements: 6.1, 6.2
      const refreshToken = req.cookies.refresh_token;

      if (!refreshToken) {
        throw new UnauthorizedError();
      }

      // Rotate refresh token
      // Requirements: 6.3-6.9
      const tokens = await tokenService.rotateRefreshToken(refreshToken);

      // Set new cookies
      // Requirements: 6.10
      res.cookie('access_token', tokens.accessToken, accessTokenCookieOptions);
      res.cookie('refresh_token', tokens.refreshToken, refreshTokenCookieOptions);

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      // Clear cookies on error
      // Requirements: 6.5
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/v1/auth' });
      next(error);
    }
  }

  /**
   * POST /v1/auth/logout
   * 
   * Logs out user by revoking current session
   * 
   * Requirements: 7.1-7.5
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Read refresh token from cookie
      // Requirements: 7.1
      const refreshToken = req.cookies.refresh_token;

      if (refreshToken) {
        // Hash token and find session
        const refreshTokenHash = await tokenService.hashToken(refreshToken);
        const session = await sessionService.findSession(refreshTokenHash);

        if (session) {
          // Revoke session
          // Requirements: 7.2, 7.3
          await sessionService.revokeSession(session.id);
        }
      }

      // Clear cookies
      // Requirements: 7.4
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/v1/auth' });

      // Return success
      // Requirements: 7.5
      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/auth/logout-all
   * 
   * Logs out user from all devices
   * 
   * Requirements: 7.6-7.9
   */
  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new UnauthorizedError();
      }

      // Revoke all user sessions
      // Requirements: 7.6, 7.7
      const count = await sessionService.revokeAllUserSessions(userId);

      // Clear cookies
      // Requirements: 7.8
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/v1/auth' });

      // Return count of revoked sessions
      // Requirements: 7.9
      res.status(200).json({
        success: true,
        data: {
          sessionsRevoked: count,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/auth/me
   * 
   * Returns current user and organization data
   * 
   * Requirements: 14.1-14.6
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new UnauthorizedError();
      }

      const result = await authService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/auth/verify-email
   * 
   * Verifies user email with token
   * 
   * Requirements: 2.5-2.8
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameter
      const validationResult = verifyEmailSchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new AppError('Invalid or missing token', 400, 'INVALID_TOKEN');
      }

      const { token } = validationResult.data;

      await authService.verifyEmail(token);

      res.status(200).json({
        success: true,
        data: {
          message: 'Email verified successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/auth/send-verification
   * 
   * Sends or resends email verification
   * 
   * Requirements: 2.9, 2.10
   */
  async sendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new UnauthorizedError();
      }

      await authService.sendVerificationEmail(userId);

      res.status(200).json({
        success: true,
        data: {
          message: 'Verification email sent',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/auth/forgot-password
   * 
   * Initiates password reset flow
   * 
   * Requirements: 8.1-8.6
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const validationResult = forgotPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors: Record<string, string[]> = {};
        validationResult.error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        throw new ValidationError(errors);
      }

      const data = validationResult.data;

      await authService.forgotPassword(data);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        data: {
          message: 'If that email exists, a reset link was sent',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/auth/reset-password
   * 
   * Resets user password with token
   * 
   * Requirements: 8.7-8.11
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const validationResult = resetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors: Record<string, string[]> = {};
        validationResult.error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        throw new ValidationError(errors);
      }

      const data = validationResult.data;

      await authService.resetPassword(data);

      res.status(200).json({
        success: true,
        data: {
          message: 'Password reset successfully. Please log in.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/auth/sessions
   * 
   * Lists all active sessions for authenticated user
   * 
   * Requirements: 9.1, 9.2
   */
  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new UnauthorizedError();
      }

      // Get current refresh token to mark current session
      const currentRefreshToken = req.cookies.refresh_token;
      let currentSessionId: string | null = null;

      if (currentRefreshToken) {
        const hash = await tokenService.hashToken(currentRefreshToken);
        const currentSession = await sessionService.findSession(hash);
        if (currentSession) {
          currentSessionId = currentSession.id;
        }
      }

      // Get all user sessions
      const sessions = await sessionService.findUserSessions(userId);

      // Convert to response format with current flag
      const sessionResponses = sessions.map((session) =>
        toSessionResponse(session, session.id === currentSessionId)
      );

      res.status(200).json({
        success: true,
        data: {
          sessions: sessionResponses,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /v1/auth/sessions/:sessionId
   * 
   * Revokes a specific session
   * 
   * Requirements: 9.3, 9.4, 9.5
   */
  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new UnauthorizedError();
      }

      // Validate session ID
      const validationResult = revokeSessionSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new AppError('Invalid session ID', 400, 'INVALID_SESSION_ID');
      }

      const { sessionId } = validationResult.data;

      // Verify session belongs to user
      // Requirements: 9.3, 9.4
      const isOwned = await sessionService.isSessionOwnedByUser(sessionId, userId);

      if (!isOwned) {
        throw new AppError('Forbidden', 403, 'FORBIDDEN');
      }

      // Revoke session
      // Requirements: 9.5
      await sessionService.revokeSession(sessionId);

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const authController = new AuthController();
