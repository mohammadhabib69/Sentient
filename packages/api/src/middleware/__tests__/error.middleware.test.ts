import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "../error.middleware.js";
import {
  AppError,
  ErrorCode,
  ValidationError,
  UnauthorizedError,
  AccountLockedError,
  RateLimitedError,
} from "../../utils/errors.js";
import { Prisma } from "@prisma/client";

describe("errorHandler middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleLogSpy: any;

  beforeEach(() => {
    mockRequest = {
      method: "POST",
      path: "/v1/auth/login",
      ip: "192.168.1.1",
      socket: { remoteAddress: "192.168.1.1" } as any,
    };
    mockResponse = {
      headersSent: false,
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should not handle error if headers already sent", () => {
    mockResponse.headersSent = true;
    const error = new UnauthorizedError();

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should log all errors to console", () => {
    const error = new UnauthorizedError();

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"auth_error"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"ip":"192.168.1.1"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"method":"POST"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"path":"/v1/auth/login"')
    );
  });

  it("should log errors with user context when authenticated", () => {
    const error = new UnauthorizedError();
    mockRequest.user = {
      id: "user-123",
      orgId: "org-456",
      role: "member" as any,
    };

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"auth_error"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"userId":"user-123"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"ip":"192.168.1.1"')
    );
  });

  it("should handle missing IP address gracefully", () => {
    const error = new UnauthorizedError();
    (mockRequest as any).ip = undefined;
    (mockRequest as any).socket = {};

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"ip":"unknown"')
    );
  });

  describe("AppError handling", () => {
    it("should format AppError with correct structure", () => {
      const error = new UnauthorizedError();

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
        },
      });
    });

    it("should include details field when present", () => {
      const fieldErrors = {
        email: ["Email is required"],
        password: ["Password must be at least 8 characters"],
      };
      const error = new ValidationError(fieldErrors);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Validation failed",
          details: fieldErrors,
        },
      });
    });

    it("should handle AccountLockedError with details", () => {
      const lockedUntil = new Date("2026-05-15T14:30:00Z");
      const error = new AccountLockedError(lockedUntil);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.ACCOUNT_LOCKED,
          message: expect.stringContaining(
            "Account locked due to too many failed login attempts",
          ),
          details: {
            lockedUntil: "2026-05-15T14:30:00.000Z",
          },
        },
      });
    });

    it("should handle RateLimitedError with retryAfter", () => {
      const error = new RateLimitedError(
        "Too many registration attempts. Please try again in 45 minutes.",
        2700,
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.RATE_LIMITED,
          message:
            "Too many registration attempts. Please try again in 45 minutes.",
          details: {
            retryAfter: 2700,
          },
        },
      });
    });
  });

  describe("Prisma error handling", () => {
    it("should map P2002 (unique constraint) to conflict error", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
        },
      );

      errorHandler(
        prismaError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Resource already exists",
        },
      });
    });

    it("should map P2025 (record not found) to not found error", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );

      errorHandler(
        prismaError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
        },
      });
    });

    it("should map P2003 (foreign key constraint) to conflict error", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed",
        {
          code: "P2003",
          clientVersion: "5.0.0",
        },
      );

      errorHandler(
        prismaError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Operation violates data constraints",
        },
      });
    });

    it("should map unknown Prisma errors to database error", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unknown error",
        {
          code: "P9999",
          clientVersion: "5.0.0",
        },
      );

      errorHandler(
        prismaError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Database operation failed",
        },
      });
    });
  });

  describe("Unknown error handling", () => {
    it("should handle generic Error as internal error", () => {
      const error = new Error("Something went wrong");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });

    it("should handle string errors as internal error", () => {
      const error = "Something went wrong";

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });

    it("should handle null/undefined errors as internal error", () => {
      errorHandler(
        null,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });
  });

  describe("Error response format compliance", () => {
    it("should always return success: false", () => {
      const error = new UnauthorizedError();

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const response = (mockResponse.json as any).mock.calls[0][0];
      expect(response.success).toBe(false);
    });

    it("should always include error.code", () => {
      const error = new UnauthorizedError();

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const response = (mockResponse.json as any).mock.calls[0][0];
      expect(response.error.code).toBeDefined();
      expect(typeof response.error.code).toBe("string");
    });

    it("should always include error.message", () => {
      const error = new UnauthorizedError();

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const response = (mockResponse.json as any).mock.calls[0][0];
      expect(response.error.message).toBeDefined();
      expect(typeof response.error.message).toBe("string");
    });

    it("should only include error.details when present", () => {
      const errorWithoutDetails = new UnauthorizedError();

      errorHandler(
        errorWithoutDetails,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const responseWithoutDetails = (mockResponse.json as any).mock.calls[0][0];
      expect(responseWithoutDetails.error.details).toBeUndefined();

      // Reset mocks
      (mockResponse.json as any).mockClear();

      const errorWithDetails = new ValidationError({ email: ["Required"] });

      errorHandler(
        errorWithDetails,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      const responseWithDetails = (mockResponse.json as any).mock.calls[0][0];
      expect(responseWithDetails.error.details).toBeDefined();
    });
  });
});
