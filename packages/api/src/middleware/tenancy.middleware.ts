import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../utils/errors.js";

export function tenancyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const orgId = (req.user as any)?.orgId;

  if (!orgId) {
    throw new ForbiddenError();
  }

  req.orgId = orgId;
  next();
}
