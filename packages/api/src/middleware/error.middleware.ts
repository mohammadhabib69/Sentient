import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";

interface ErrorResponseBody {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  // Always log full server-side error details.
  console.error(err);

  let normalizedError: AppError;

  if (err instanceof AppError) {
    normalizedError = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    normalizedError = mapPrismaError(err);
  } else {
    normalizedError = new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }

  const body: ErrorResponseBody = {
    success: false,
    error: {
      message: normalizedError.message,
      code: normalizedError.code ?? "INTERNAL_ERROR",
      statusCode: normalizedError.statusCode,
    },
  };

  res.status(normalizedError.statusCode).json(body);
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case "P2002":
      return new AppError("Resource already exists", 409, "CONFLICT");
    case "P2025":
      return new AppError("Resource not found", 404, "NOT_FOUND");
    case "P2003":
      return new AppError("Operation violates data constraints", 409, "CONFLICT");
    default:
      return new AppError("Database operation failed", 500, "DATABASE_ERROR");
  }
}
