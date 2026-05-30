import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import type { ErrorResponse } from "../types/shared.types.js";
import { AppError, ErrorCode } from "../utils/errors.js";
import { authLogger } from "../utils/auth-logger.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  // Extract context information
  const userId = (req.user as { id?: string } | undefined)?.id;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const method = req.method;
  const path = req.path;

  // Log error with structured logging
  // Requirements: Error handling
  authLogger.authError(err, ip, userId, method, path);

  let normalizedError: AppError;

  if (err instanceof AppError) {
    normalizedError = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    normalizedError = mapPrismaError(err);
  } else {
    normalizedError = new AppError(
      "Internal server error",
      500,
      ErrorCode.INTERNAL_ERROR,
    );
  }

  const body: ErrorResponse = {
    success: false,
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
      ...(normalizedError.details && { details: normalizedError.details }),
    },
  };

  res.status(normalizedError.statusCode).json(body);
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case "P2002":
      return new AppError(
        "Resource already exists",
        409,
        "CONFLICT" as ErrorCode,
      );
    case "P2025":
      return new AppError("Resource not found", 404, "NOT_FOUND" as ErrorCode);
    case "P2003":
      return new AppError(
        "Operation violates data constraints",
        409,
        "CONFLICT" as ErrorCode,
      );
    default:
      return new AppError(
        "Database operation failed",
        500,
        "DATABASE_ERROR" as ErrorCode,
      );
  }
}
