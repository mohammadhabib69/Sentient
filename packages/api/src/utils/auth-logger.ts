import crypto from 'crypto';

/**
 * Auth Logger Utility
 * 
 * Provides structured logging for authentication events with security monitoring.
 * All logs are output in JSON format for easy parsing and analysis.
 * 
 * Requirements: Error handling, security monitoring
 */

interface BaseLogData {
  timestamp: string;
  event: string;
}

interface UserRegisteredData extends BaseLogData {
  event: 'user_registered';
  userId: string;
  orgId: string;
}

interface LoginSuccessData extends BaseLogData {
  event: 'login_success';
  userId: string;
  ip: string;
  browser?: string;
  os?: string;
  deviceType?: string;
}

interface LoginFailedData extends BaseLogData {
  event: 'login_failed';
  emailHash: string;
  ip: string;
}

interface AccountLockedData extends BaseLogData {
  event: 'account_locked';
  userId: string;
  ip: string;
}

interface TokenRefreshedData extends BaseLogData {
  event: 'token_refreshed';
  userId: string;
}

interface LogoutData extends BaseLogData {
  event: 'logout';
  userId: string;
}

interface LogoutAllData extends BaseLogData {
  event: 'logout_all';
  userId: string;
  sessionsRevoked: number;
}

interface PasswordResetRequestedData extends BaseLogData {
  event: 'password_reset_requested';
  userId: string;
}

interface PasswordResetCompletedData extends BaseLogData {
  event: 'password_reset_completed';
  userId: string;
}

interface EmailVerifiedData extends BaseLogData {
  event: 'email_verified';
  userId: string;
}

interface AuthErrorData extends BaseLogData {
  event: 'auth_error';
  userId?: string;
  ip: string;
  errorMessage: string;
  errorCode?: string;
  stackTrace?: string;
  method?: string;
  path?: string;
}

type AuthLogData =
  | UserRegisteredData
  | LoginSuccessData
  | LoginFailedData
  | AccountLockedData
  | TokenRefreshedData
  | LogoutData
  | LogoutAllData
  | PasswordResetRequestedData
  | PasswordResetCompletedData
  | EmailVerifiedData
  | AuthErrorData;

/**
 * Logs authentication events in structured JSON format
 */
function logAuthEvent(data: AuthLogData): void {
  console.log(JSON.stringify(data));
}

/**
 * Hashes an email address for secure logging
 * Uses SHA-256 to prevent email exposure in logs
 */
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email).digest('hex');
}

/**
 * Auth Logger
 * 
 * Centralized logging for all authentication events
 */
export const authLogger = {
  /**
   * Log successful user registration
   * 
   * @param userId - User ID
   * @param orgId - Organization ID
   */
  userRegistered(userId: string, orgId: string): void {
    logAuthEvent({
      event: 'user_registered',
      timestamp: new Date().toISOString(),
      userId,
      orgId,
    });
  },

  /**
   * Log successful login
   * 
   * @param userId - User ID
   * @param ip - IP address
   * @param browser - Browser name (optional)
   * @param os - Operating system (optional)
   * @param deviceType - Device type (optional)
   */
  loginSuccess(
    userId: string,
    ip: string,
    browser?: string,
    os?: string,
    deviceType?: string
  ): void {
    logAuthEvent({
      event: 'login_success',
      timestamp: new Date().toISOString(),
      userId,
      ip,
      browser,
      os,
      deviceType,
    });
  },

  /**
   * Log failed login attempt
   * 
   * @param email - Email address (will be hashed)
   * @param ip - IP address
   */
  loginFailed(email: string, ip: string): void {
    logAuthEvent({
      event: 'login_failed',
      timestamp: new Date().toISOString(),
      emailHash: hashEmail(email),
      ip,
    });
  },

  /**
   * Log account lockout
   * 
   * @param userId - User ID
   * @param ip - IP address
   */
  accountLocked(userId: string, ip: string): void {
    logAuthEvent({
      event: 'account_locked',
      timestamp: new Date().toISOString(),
      userId,
      ip,
    });
  },

  /**
   * Log token refresh event
   * 
   * @param userId - User ID
   */
  tokenRefreshed(userId: string): void {
    logAuthEvent({
      event: 'token_refreshed',
      timestamp: new Date().toISOString(),
      userId,
    });
  },

  /**
   * Log logout event
   * 
   * @param userId - User ID
   */
  logout(userId: string): void {
    logAuthEvent({
      event: 'logout',
      timestamp: new Date().toISOString(),
      userId,
    });
  },

  /**
   * Log logout from all devices
   * 
   * @param userId - User ID
   * @param sessionsRevoked - Number of sessions revoked
   */
  logoutAll(userId: string, sessionsRevoked: number): void {
    logAuthEvent({
      event: 'logout_all',
      timestamp: new Date().toISOString(),
      userId,
      sessionsRevoked,
    });
  },

  /**
   * Log password reset request
   * 
   * @param userId - User ID
   */
  passwordResetRequested(userId: string): void {
    logAuthEvent({
      event: 'password_reset_requested',
      timestamp: new Date().toISOString(),
      userId,
    });
  },

  /**
   * Log password reset completion
   * 
   * @param userId - User ID
   */
  passwordResetCompleted(userId: string): void {
    logAuthEvent({
      event: 'password_reset_completed',
      timestamp: new Date().toISOString(),
      userId,
    });
  },

  /**
   * Log email verification
   * 
   * @param userId - User ID
   */
  emailVerified(userId: string): void {
    logAuthEvent({
      event: 'email_verified',
      timestamp: new Date().toISOString(),
      userId,
    });
  },

  /**
   * Log authentication error with context
   * 
   * @param error - Error object
   * @param ip - IP address
   * @param userId - User ID (optional, if available)
   * @param method - HTTP method (optional)
   * @param path - Request path (optional)
   */
  authError(
    error: Error | unknown,
    ip: string,
    userId?: string,
    method?: string,
    path?: string
  ): void {
    // Extract error message
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }

    // Extract error code if available
    const errorCode = error && typeof error === 'object' && 'code' in error 
      ? (error as { code?: string }).code 
      : undefined;

    // Extract stack trace if available
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    logAuthEvent({
      event: 'auth_error',
      timestamp: new Date().toISOString(),
      userId,
      ip,
      errorMessage,
      errorCode,
      stackTrace,
      method,
      path,
    });
  },
};
