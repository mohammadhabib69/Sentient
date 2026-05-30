import type { NextFunction, Request, Response } from "express";
import { tokenService } from "../services/token.service.js";
import { AppError, UnauthorizedError } from "../utils/errors.js";
import { prisma } from "../config/prisma.js";

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(new UnauthorizedError());
  }

  try {
    const decoded = tokenService.verifyAccessToken(token);

    if (!decoded?.sub || !decoded.orgId || !decoded.role) {
      return next(new UnauthorizedError());
    }

    // Verify session in database if sid is present
    if (decoded.sid) {
      const session = await prisma.session.findUnique({
        where: { id: decoded.sid },
      });

      if (!session || session.revoked || session.expiresAt < new Date()) {
        return next(new UnauthorizedError());
      }
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
      return next(new AppError("Access token expired", 401, "TOKEN_EXPIRED"));
    }

    return next(new UnauthorizedError());
  }
}

// Alias for consistency with task requirements
export const requireAuth = authMiddleware;
