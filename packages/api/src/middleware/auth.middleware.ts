import type { NextFunction, Request, Response } from "express";
import { tokenService } from "../services/token.service.js";
import { AppError, UnauthorizedError } from "../utils/errors.js";

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token;

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const decoded = tokenService.verifyAccessToken(token);

    if (!decoded?.sub || !decoded.orgId || !decoded.role) {
      throw new UnauthorizedError();
    }

    req.user = {
      id: decoded.sub,
      orgId: decoded.orgId,
      role: decoded.role,
    };
    req.orgId = decoded.orgId;

    next();
  } catch (error) {
    if (error instanceof Error && error.message === "TOKEN_EXPIRED") {
      throw new AppError("Access token expired", 401, "TOKEN_EXPIRED");
    }

    throw new UnauthorizedError();
  }
}

// Alias for consistency with task requirements
export const requireAuth = authMiddleware;
