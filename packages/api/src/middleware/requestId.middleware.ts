import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers["x-request-id"];
  const requestId = typeof header === "string" && header.length > 0 ? header : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
