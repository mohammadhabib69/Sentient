import { describe, it, expect } from "vitest";
import {
  ErrorCode,
  AppError,
  ValidationError,
  InvalidTokenError,
  EmailAlreadyVerifiedError,
  UnauthorizedError,
  InvalidCredentialsError,
  TokenExpiredError,
  ForbiddenError,
  ResourceAccessDeniedError,
  EmailExistsError,
  RateLimitedError,
  AccountLockedError,
  InternalError,
  NotFoundError,
  ConflictError,
} from "../errors.js";

describe("ErrorCode constants", () => {
  it("should define all required error codes", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.INVALID_TOKEN).toBe("INVALID_TOKEN");
    expect(ErrorCode.EMAIL_ALREADY_VERIFIED).toBe("EMAIL_ALREADY_VERIFIED");
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.INVALID_CREDENTIALS).toBe("INVALID_CREDENTIALS");
    expect(ErrorCode.TOKEN_EXPIRED).toBe("TOKEN_EXPIRED");
    expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCode.RESOURCE_ACCESS_DENIED).toBe("RESOURCE_ACCESS_DENIED");
    expect(ErrorCode.EMAIL_EXISTS).toBe("EMAIL_EXISTS");
    expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
    expect(ErrorCode.ACCOUNT_LOCKED).toBe("ACCOUNT_LOCKED");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
  });

  it("should have exactly 12 error codes", () => {
    const errorCodes = Object.keys(ErrorCode);
    expect(errorCodes).toHaveLength(12);
  });
});

describe("AppError", () => {
  it("should create error with all properties", () => {
    const error = new AppError(
      "Test error",
      400,
      ErrorCode.VALIDATION_ERROR,
      { field: "email" },
    );

    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.details).toEqual({ field: "email" });
    expect(error.name).toBe("AppError");
  });

  it("should create error without details", () => {
    const error = new AppError("Test error", 400, ErrorCode.VALIDATION_ERROR);

    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.details).toBeUndefined();
  });

  it("should be instance of Error", () => {
    const error = new AppError("Test error", 400, ErrorCode.VALIDATION_ERROR);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("should have stack trace", () => {
    const error = new AppError("Test error", 400, ErrorCode.VALIDATION_ERROR);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("AppError");
  });
});

describe("ValidationError", () => {
  it("should create validation error with field errors", () => {
    const fieldErrors = {
      email: ["Email is required", "Email must be valid"],
      password: ["Password must be at least 8 characters"],
    };
    const error = new ValidationError(fieldErrors);

    expect(error.message).toBe("Validation failed");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.details).toEqual(fieldErrors);
  });

  it("should be instance of AppError", () => {
    const error = new ValidationError({ email: ["Invalid"] });

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ValidationError);
  });
});

describe("InvalidTokenError", () => {
  it("should create invalid token error with default message", () => {
    const error = new InvalidTokenError();

    expect(error.message).toBe("Invalid or expired token");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.INVALID_TOKEN);
    expect(error.details).toBeUndefined();
  });

  it("should create invalid token error with custom message", () => {
    const error = new InvalidTokenError("Verification token expired");

    expect(error.message).toBe("Verification token expired");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.INVALID_TOKEN);
  });
});

describe("EmailAlreadyVerifiedError", () => {
  it("should create email already verified error", () => {
    const error = new EmailAlreadyVerifiedError();

    expect(error.message).toBe("Email is already verified");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.EMAIL_ALREADY_VERIFIED);
    expect(error.details).toBeUndefined();
  });
});

describe("UnauthorizedError", () => {
  it("should create unauthorized error with default message", () => {
    const error = new UnauthorizedError();

    expect(error.message).toBe("Unauthorized");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.details).toBeUndefined();
  });

  it("should create unauthorized error with custom message", () => {
    const error = new UnauthorizedError("Missing access token");

    expect(error.message).toBe("Missing access token");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
  });
});

describe("InvalidCredentialsError", () => {
  it("should create invalid credentials error", () => {
    const error = new InvalidCredentialsError();

    expect(error.message).toBe("Invalid email or password");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(error.details).toBeUndefined();
  });
});

describe("TokenExpiredError", () => {
  it("should create token expired error", () => {
    const error = new TokenExpiredError();

    expect(error.message).toBe("Access token has expired");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCode.TOKEN_EXPIRED);
    expect(error.details).toBeUndefined();
  });
});

describe("ForbiddenError", () => {
  it("should create forbidden error with default message", () => {
    const error = new ForbiddenError();

    expect(error.message).toBe("Forbidden");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCode.FORBIDDEN);
    expect(error.details).toBeUndefined();
  });

  it("should create forbidden error with custom message", () => {
    const error = new ForbiddenError("Insufficient permissions");

    expect(error.message).toBe("Insufficient permissions");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCode.FORBIDDEN);
  });
});

describe("ResourceAccessDeniedError", () => {
  it("should create resource access denied error with default message", () => {
    const error = new ResourceAccessDeniedError();

    expect(error.message).toBe(
      "You do not have permission to access this resource",
    );
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCode.RESOURCE_ACCESS_DENIED);
    expect(error.details).toBeUndefined();
  });

  it("should create resource access denied error with custom message", () => {
    const error = new ResourceAccessDeniedError("Cannot access this project");

    expect(error.message).toBe("Cannot access this project");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCode.RESOURCE_ACCESS_DENIED);
  });
});

describe("EmailExistsError", () => {
  it("should create email exists error", () => {
    const error = new EmailExistsError();

    expect(error.message).toBe("Email is already registered");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe(ErrorCode.EMAIL_EXISTS);
    expect(error.details).toBeUndefined();
  });
});

describe("RateLimitedError", () => {
  it("should create rate limited error without retry after", () => {
    const error = new RateLimitedError("Too many requests");

    expect(error.message).toBe("Too many requests");
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe(ErrorCode.RATE_LIMITED);
    expect(error.details).toBeUndefined();
  });

  it("should create rate limited error with retry after", () => {
    const error = new RateLimitedError(
      "Too many registration attempts. Please try again in 45 minutes.",
      2700,
    );

    expect(error.message).toBe(
      "Too many registration attempts. Please try again in 45 minutes.",
    );
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe(ErrorCode.RATE_LIMITED);
    expect(error.details).toEqual({ retryAfter: 2700 });
  });
});

describe("AccountLockedError", () => {
  it("should create account locked error with correct message and details", () => {
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    const error = new AccountLockedError(lockedUntil);

    expect(error.message).toContain(
      "Account locked due to too many failed login attempts",
    );
    expect(error.message).toContain("15 minutes");
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe(ErrorCode.ACCOUNT_LOCKED);
    expect(error.details).toEqual({
      lockedUntil: lockedUntil.toISOString(),
    });
  });

  it("should calculate minutes remaining correctly", () => {
    const lockedUntil = new Date(Date.now() + 7 * 60 * 1000); // 7 minutes from now
    const error = new AccountLockedError(lockedUntil);

    expect(error.message).toContain("7 minutes");
  });

  it("should round up partial minutes", () => {
    const lockedUntil = new Date(Date.now() + 5.5 * 60 * 1000); // 5.5 minutes from now
    const error = new AccountLockedError(lockedUntil);

    expect(error.message).toContain("6 minutes");
  });
});

describe("InternalError", () => {
  it("should create internal error with default message", () => {
    const error = new InternalError();

    expect(error.message).toBe("Internal server error");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.details).toBeUndefined();
  });

  it("should create internal error with custom message", () => {
    const error = new InternalError("Database connection failed");

    expect(error.message).toBe("Database connection failed");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});

describe("Legacy error classes", () => {
  describe("NotFoundError", () => {
    it("should create not found error", () => {
      const error = new NotFoundError("User");

      expect(error.message).toBe("User not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe("ConflictError", () => {
    it("should create conflict error", () => {
      const error = new ConflictError("Resource already exists");

      expect(error.message).toBe("Resource already exists");
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT");
      expect(error).toBeInstanceOf(AppError);
    });
  });
});

describe("Error response format", () => {
  it("should match the spec format for errors with details", () => {
    const error = new ValidationError({
      email: ["Email is required"],
      password: ["Password must be at least 8 characters"],
    });

    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };

    expect(response).toEqual({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: {
          email: ["Email is required"],
          password: ["Password must be at least 8 characters"],
        },
      },
    });
  });

  it("should match the spec format for errors without details", () => {
    const error = new UnauthorizedError();

    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };

    expect(response).toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      },
    });
  });

  it("should match the spec format for account locked error", () => {
    const lockedUntil = new Date("2026-05-15T14:30:00Z");
    const error = new AccountLockedError(lockedUntil);

    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };

    expect(response.success).toBe(false);
    expect(response.error.code).toBe("ACCOUNT_LOCKED");
    expect(response.error.message).toContain(
      "Account locked due to too many failed login attempts",
    );
    expect(response.error.details).toEqual({
      lockedUntil: "2026-05-15T14:30:00.000Z",
    });
  });

  it("should match the spec format for rate limited error", () => {
    const error = new RateLimitedError(
      "Too many registration attempts. Please try again in 45 minutes.",
      2700,
    );

    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };

    expect(response).toEqual({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message:
          "Too many registration attempts. Please try again in 45 minutes.",
        details: {
          retryAfter: 2700,
        },
      },
    });
  });
});
