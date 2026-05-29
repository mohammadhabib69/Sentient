import { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

export type ResourceOwnerGetter = (req: Request) => Promise<string | null>;

const roleOrder: UserRole[] = [
  "GUEST",
  "MEMBER",
  "MANAGER",
  "ORG_ADMIN",
  "SUPER_ADMIN",
];

/**
 * ABAC middleware factory
 * Grants access if the user owns the resource or has the minimum required role.
 * Super admins and org admins bypass ownership checks.
 */
export function requireOwnerOrRole(
  getResourceOwnerId: ResourceOwnerGetter,
  minimumRole: UserRole = "MANAGER",
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const userId = (req.user as any)?.id;
    const role = (req.user as any)?.role;

    if (!userId || !role) {
      throw new UnauthorizedError();
    }

    if (role === "SUPER_ADMIN" || role === "ORG_ADMIN") {
      next();
      return;
    }

    if (roleOrder.indexOf(role) >= roleOrder.indexOf(minimumRole)) {
      next();
      return;
    }

    const ownerId = await getResourceOwnerId(req);
    if (ownerId && ownerId === userId) {
      next();
      return;
    }

    throw new ForbiddenError();
  };
}
