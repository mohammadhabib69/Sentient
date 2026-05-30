/**
 * Error codes used throughout the authentication system
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_TOKEN: "INVALID_TOKEN",
  EMAIL_ALREADY_VERIFIED: "EMAIL_ALREADY_VERIFIED",
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  RESOURCE_ACCESS_DENIED: "RESOURCE_ACCESS_DENIED",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  RATE_LIMITED: "RATE_LIMITED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Base application error class with consistent structure
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: ErrorCode,
    public details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Request validation failed
 */
export class ValidationError extends AppError {
  constructor(errors: Record<string, string[]>) {
    super("Validation failed", 400, ErrorCode.VALIDATION_ERROR, errors);
  }
}

/**
 * 400 Bad Request - Token is invalid or expired
 */
export class InvalidTokenError extends AppError {
  constructor(message = "Invalid or expired token") {
    super(message, 400, ErrorCode.INVALID_TOKEN);
  }
}

/**
 * 400 Bad Request - Email is already verified
 */
export class EmailAlreadyVerifiedError extends AppError {
  constructor() {
    super("Email is already verified", 400, ErrorCode.EMAIL_ALREADY_VERIFIED);
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

/**
 * 401 Unauthorized - Invalid email or password
 */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Invalid email or password", 401, ErrorCode.INVALID_CREDENTIALS);
  }
}

/**
 * 401 Unauthorized - Access token has expired
 */
export class TokenExpiredError extends AppError {
  constructor() {
    super("Access token has expired", 401, ErrorCode.TOKEN_EXPIRED);
  }
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

/**
 * 403 Forbidden - User cannot access this resource
 */
export class ResourceAccessDeniedError extends AppError {
  constructor(message = "You do not have permission to access this resource") {
    super(message, 403, ErrorCode.RESOURCE_ACCESS_DENIED);
  }
}

/**
 * 409 Conflict - Email already registered
 */
export class EmailExistsError extends AppError {
  constructor() {
    super("Email is already registered", 409, ErrorCode.EMAIL_EXISTS);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitedError extends AppError {
  constructor(message: string, retryAfter?: number) {
    super(
      message,
      429,
      ErrorCode.RATE_LIMITED,
      retryAfter ? { retryAfter } : undefined,
    );
  }
}

/**
 * 429 Too Many Requests - Account locked due to failed login attempts
 */
export class AccountLockedError extends AppError {
  constructor(lockedUntil: Date) {
    const minutesRemaining = Math.ceil(
      (lockedUntil.getTime() - Date.now()) / 60000,
    );
    super(
      `Account locked due to too many failed login attempts. Try again in ${minutesRemaining} minutes.`,
      429,
      ErrorCode.ACCOUNT_LOCKED,
      { lockedUntil: lockedUntil.toISOString() },
    );
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, ErrorCode.INTERNAL_ERROR);
  }
}

/**
 * Legacy error classes for backward compatibility
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND" as ErrorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT" as ErrorCode);
  }
}
