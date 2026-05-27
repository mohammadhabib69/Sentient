export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("Unauthorized", 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("Forbidden", 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  constructor(public errors: Record<string, string[]>) {
    super("Validation failed", 422, "VALIDATION_ERROR");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}
