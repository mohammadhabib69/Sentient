import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../utils/errors.js";

type JwtPayload = {
  id: string;
  orgId: string;
  role: UserRole;
};

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    // Stub implementation: validates JWT structure only, does not verify signature yet
    const decoded = jwt.decode(token) as JwtPayload | null;

    if (!decoded || !decoded.id || !decoded.orgId || !decoded.role) {
      throw new UnauthorizedError();
    }

    req.user = {
      id: decoded.id,
      orgId: decoded.orgId,
      role: decoded.role,
    };

    next();
  } catch {
    throw new UnauthorizedError();
  }
}
