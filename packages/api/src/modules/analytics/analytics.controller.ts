import type { NextFunction, Request, Response } from "express";
import { analyticsService } from "./analytics.service.js";
import { overviewAnalyticsService } from "./overview.analytics.js";
import { velocityAnalyticsService } from "./velocity.analytics.js";
import { agentAnalyticsService } from "./agent.analytics.js";
import { projectsAnalyticsService } from "./projects.analytics.js";
import { anomalyDetectionService } from "./anomaly-detection.js";
import { forecastAnalyticsService } from "./forecast.analytics.js";
import { snapshotsAnalyticsService } from "./snapshots.analytics.js";
import { reportsAnalyticsService } from "./reports.analytics.js";
import { adminAnalyticsService } from "./admin.analytics.js";
import {
  agentPerformanceQuerySchema,
  anomaliesListQuerySchema,
  anomalyIdParamSchema,
  customReportCreateSchema,
  customReportIdParamSchema,
  customReportUpdateSchema,
  forecastsListQuerySchema,
  projectsHealthQuerySchema,
  reportExecuteSchema,
  snapshotCreateSchema,
  snapshotListQuerySchema,
  taskVelocityQuerySchema,
} from "./analytics.schema.js";
import { ValidationError } from "../../utils/errors.js";

/**
 * Analytics controller.
 *
 * Phase 7 endpoints (read from CQRS read models):
 *   GET /v1/analytics/overview            — overview metrics
 *   GET /v1/analytics/task-velocity       — task completion trends
 *   GET /v1/analytics/agent-performance   — per-agent success rates
 *
 * Phase 11 endpoints (BI dashboard):
 *   GET  /v1/analytics/overview-full            — extended overview w/ alerts/risks
 *   GET  /v1/analytics/velocity                 — burndown + 14d forecast
 *   GET  /v1/analytics/agents                   — agent performance w/ errors
 *   GET  /v1/analytics/projects                 — project health
 *   GET  /v1/analytics/anomalies               — list detected anomalies
 *   POST /v1/analytics/anomalies/:id/acknowledge
 *   GET  /v1/analytics/forecasts               — list forecasts
 *   POST /v1/analytics/forecasts/refresh       — generate fresh forecasts
 *   GET  /v1/analytics/snapshots               — list saved snapshots
 *   POST /v1/analytics/snapshots               — create snapshot
 *   DELETE /v1/analytics/snapshots/:id
 *   GET  /v1/analytics/reports                 — list custom reports
 *   POST /v1/analytics/reports                 — create report
 *   PATCH /v1/analytics/reports/:id
 *   DELETE /v1/analytics/reports/:id
 *   POST /v1/analytics/reports/:id/execute     — run a report
 *   GET  /v1/analytics/admin/insights          — system health for admins
 *   GET  /v1/analytics/admin/queue-stats       — queue health snapshot
 */
export class AnalyticsController {
  // ─── Phase 7 endpoints (preserved) ────────────────────────

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
      const parsed = this.parseOrThrow(taskVelocityQuerySchema, req.query);
      const result = await analyticsService.getTaskVelocity(
        orgId,
        parsed.days,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async agentPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const parsed = this.parseOrThrow(agentPerformanceQuerySchema, req.query);
      const result = await analyticsService.getAgentPerformance(
        orgId,
        parsed.days,
        parsed.agentId,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ─── Phase 11 endpoints ──────────────────────────────────

  async overviewFull(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const result = await overviewAnalyticsService.getOverview(orgId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async velocity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const parsed = this.parseOrThrow(taskVelocityQuerySchema, req.query);
      const result = await velocityAnalyticsService.getVelocity(
        orgId,
        parsed.days,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async agents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const parsed = this.parseOrThrow(agentPerformanceQuerySchema, req.query);
      const result = await agentAnalyticsService.getAgentMetrics(
        orgId,
        parsed.days,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async projects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const parsed = this.parseOrThrow(projectsHealthQuerySchema, req.query);
      const result = await projectsAnalyticsService.getProjectHealth(
        orgId,
        parsed.limit,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async listAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const parsed = this.parseOrThrow(anomaliesListQuerySchema, req.query);
      const result = await anomalyDetectionService.listAnomalies(orgId, {
        severity: parsed.severity,
        limit: parsed.limit,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async acknowledgeAnomaly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string | undefined;
      const params = this.parseOrThrow(anomalyIdParamSchema, req.params);
      if (!userId) {
        res
          .status(401)
          .json({ success: false, error: "Authentication required" });
        return;
      }
      const result = await anomalyDetectionService.acknowledgeAnomaly(
        orgId,
        params.id,
        userId,
      );
      if (!result) {
        res
          .status(404)
          .json({ success: false, error: "Anomaly not found" });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async refreshAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const result = await anomalyDetectionService.detectAll(orgId);
      res.status(200).json({ success: true, data: { results: result } });
    } catch (error) {
      next(error);
    }
  }

  async listForecasts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const parsed = this.parseOrThrow(forecastsListQuerySchema, req.query);
      const result = await forecastAnalyticsService.listForecasts(orgId, {
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        metric: parsed.metric,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async refreshForecasts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const [project, agent] = await Promise.all([
        forecastAnalyticsService.generateProjectCompletionForecasts(orgId),
        forecastAnalyticsService.generateAgentSuccessForecasts(orgId),
      ]);
      res.status(200).json({
        success: true,
        data: {
          projects: project,
          agents: agent,
          total: project.length + agent.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async listSnapshots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const parsed = this.parseOrThrow(snapshotListQuerySchema, req.query);
      const result = await snapshotsAnalyticsService.list(orgId, parsed.limit);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createSnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string | null;
      const body = this.parseOrThrow(snapshotCreateSchema, req.body);
      const result = await snapshotsAnalyticsService.create(orgId, userId, body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteSnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const params = this.parseOrThrow(anomalyIdParamSchema, req.params);
      const ok = await snapshotsAnalyticsService.delete(orgId, params.id);
      if (!ok) {
        res
          .status(404)
          .json({ success: false, error: "Snapshot not found" });
        return;
      }
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const result = await reportsAnalyticsService.list(orgId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const body = this.parseOrThrow(customReportCreateSchema, req.body);
      const result = await reportsAnalyticsService.create(orgId, userId, body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const params = this.parseOrThrow(customReportIdParamSchema, req.params);
      const body = this.parseOrThrow(customReportUpdateSchema, req.body);
      const result = await reportsAnalyticsService.update(orgId, params.id, body);
      if (!result) {
        res
          .status(404)
          .json({ success: false, error: "Report not found" });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const params = this.parseOrThrow(customReportIdParamSchema, req.params);
      const ok = await reportsAnalyticsService.delete(orgId, params.id);
      if (!ok) {
        res
          .status(404)
          .json({ success: false, error: "Report not found" });
        return;
      }
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async executeReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const userId = (req as any).user?.id as string;
      const params = this.parseOrThrow(customReportIdParamSchema, req.params);
      const body = this.parseOrThrow(reportExecuteSchema, req.body ?? {});
      const result = await reportsAnalyticsService.execute(
        orgId,
        params.id,
        userId,
        body.format,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async listReportExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const params = this.parseOrThrow(customReportIdParamSchema, req.params);
      const result = await reportsAnalyticsService.listExecutions(
        orgId,
        params.id,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async adminInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const result = await adminAnalyticsService.getInsights(orgId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async queueStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = (req as any).orgId as string;
      const result = await adminAnalyticsService.getInsights(orgId);
      res.status(200).json({ success: true, data: { queues: result.queues } });
    } catch (error) {
      next(error);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────

  private parseOrThrow<T>(schema: import("zod").ZodType<T>, payload: unknown): T {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      throw new ValidationError(errors);
    }
    return parsed.data;
  }
}

export const analyticsController = new AnalyticsController();
