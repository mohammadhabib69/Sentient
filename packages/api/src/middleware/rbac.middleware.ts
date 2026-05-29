// packages/api/src/middleware/rbac.middleware.ts

import { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

export type Permission =
  | "org:read" | "org:write"
  | "members:invite" | "members:remove"
  | "workspace:create" | "workspace:read"
  | "project:create" | "project:read" | "project:write"
  | "task:create" | "task:read" | "task:write" | "task:write-own"
  | "agent:manage" | "agent:approve"
  | "analytics:read"
  | "billing:manage"
  | "webhook:manage"
  | "stream:read";

type RolePermission = Permission | "*";

export const rolePermissions: Record<UserRole, RolePermission[]> = {
  SUPER_ADMIN: ["*"],
  ORG_ADMIN: [
    "org:read",
    "org:write",
    "members:invite",
    "members:remove",
    "workspace:create",
    "workspace:read",
    "project:create",
    "project:read",
    "project:write",
    "task:create",
    "task:read",
    "task:write",
    "agent:manage",
    "agent:approve",
    "analytics:read",
    "billing:manage",
    "webhook:manage",
    "stream:read",
  ],
  MANAGER: [
    "workspace:read",
    "project:create",
    "project:read",
    "project:write",
    "task:create",
    "task:read",
    "task:write",
    "agent:approve",
    "analytics:read",
    "stream:read",
  ],
  MEMBER: [
    "workspace:read",
    "project:read",
    "task:create",
    "task:read",
    "task:write-own",
    "stream:read",
  ],
  GUEST: [
    "workspace:read",
    "project:read",
    "task:read",
    "stream:read",
  ],
};

/**
 * RBAC middleware factory
 * Checks if the authenticated user's role is in the list of allowed roles
 * @param roles - One or more UserRole values that are allowed to access the route
 * @returns Express middleware function
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!roles.includes((req.user as any).role)) {
      throw new ForbiddenError();
    }

    next();
  };
}

/**
 * RBAC permission middleware factory
 * Checks whether the authenticated role contains the required permission
 * @param permission - Permission value required to access the route
 * @returns Express middleware function
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = (req.user as any)?.role;

    if (!role) {
      throw new UnauthorizedError();
    }

    const permissions = rolePermissions[role as UserRole];
    if (permissions.includes("*") || permissions.includes(permission)) {
      next();
      return;
    }

    throw new ForbiddenError();
  };
}
