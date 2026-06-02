import type { NextFunction, Request, Response } from "express";
import { analyticsService } from "./analytics.service.js";
import {
  taskVelocityQuerySchema,
  agentPerformanceQuerySchema,
} from "./analytics.schema.js";
import { ValidationError } from "../../utils/errors.js";

/**
 * Analytics controller (Phase 7).
 *
 *   GET /v1/analytics/overview            — read from OrgMetricsReadModel
 *   GET /v1/analytics/task-velocity       — read from TimescaleDB
 *   GET /v1/analytics/agent-performance   — read from TimescaleDB
 */
export class AnalyticsController {
  async overview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const result = await analyticsService.getOrgOverview(orgId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async taskVelocity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const parsed = taskVelocityQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const errors: Record<string, string[]> = {};
        parsed.error.issues.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });
        throw new ValidationError(errors);
      }
      const result = await analyticsService.getTaskVelocity(
        orgId,
        parsed.data.days,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async agentPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const parsed = agentPerformanceQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const errors: Record<string, string[]> = {};
        parsed.error.issues.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });
        throw new ValidationError(errors);
      }
      const result = await analyticsService.getAgentPerformance(
        orgId,
        parsed.data.days,
        parsed.data.agentId,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
