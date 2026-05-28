// packages/api/src/middleware/rbac.middleware.ts
// Phase 3 stub — implementation in later phases

import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../utils/errors.js";

/**
 * RBAC middleware factory
 * Checks if the authenticated user's role is in the list of allowed roles
 * @param roles - One or more UserRole values that are allowed to access the route
 * @returns Express middleware function
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError();
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}
