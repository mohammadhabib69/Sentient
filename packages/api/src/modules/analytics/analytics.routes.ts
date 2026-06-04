import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { analyticsController } from "./analytics.controller.js";

/**
 * Analytics routes.
 *
 * Phase 7 — basic read-model endpoints (preserved):
 *   GET /overview            (analytics:read)
 *   GET /task-velocity       (analytics:read)
 *   GET /agent-performance   (analytics:read)
 *
 * Phase 11 — BI dashboard:
 *   GET  /overview-full              (analytics:read)
 *   GET  /velocity                   (analytics:read)
 *   GET  /agents                     (analytics:read)
 *   GET  /projects                   (analytics:read)
 *   GET  /anomalies                  (analytics:read)
 *   POST /anomalies/:id/acknowledge  (analytics:read)
 *   POST /anomalies/refresh          (analytics:read)
 *   GET  /forecasts                  (analytics:read)
 *   POST /forecasts/refresh          (analytics:read)
 *   GET  /snapshots                  (analytics:read)
 *   POST /snapshots                  (analytics:read)
 *   DELETE /snapshots/:id            (analytics:read)
 *   GET  /reports                    (analytics:read)
 *   POST /reports                    (analytics:read)
 *   PATCH /reports/:id               (analytics:read)
 *   DELETE /reports/:id              (analytics:read)
 *   POST /reports/:id/execute        (analytics:read)
 *   GET  /admin/insights             (analytics:read — admin section)
 *   GET  /admin/queue-stats          (analytics:read — admin section)
 */
export const analyticsRouter = Router();

// Phase 7 — read-model endpoints
analyticsRouter.get(
  "/overview",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.overview.bind(analyticsController),
);

analyticsRouter.get(
  "/task-velocity",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.taskVelocity.bind(analyticsController),
);

analyticsRouter.get(
  "/agent-performance",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.agentPerformance.bind(analyticsController),
);

// Phase 11 — BI dashboard endpoints
analyticsRouter.get(
  "/overview-full",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.overviewFull.bind(analyticsController),
);

analyticsRouter.get(
  "/velocity",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.velocity.bind(analyticsController),
);

analyticsRouter.get(
  "/agents",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.agents.bind(analyticsController),
);

analyticsRouter.get(
  "/projects",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.projects.bind(analyticsController),
);

// Anomalies
analyticsRouter.get(
  "/anomalies",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.listAnomalies.bind(analyticsController),
);

analyticsRouter.post(
  "/anomalies/refresh",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.refreshAnomalies.bind(analyticsController),
);

analyticsRouter.post(
  "/anomalies/:id/acknowledge",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.acknowledgeAnomaly.bind(analyticsController),
);

// Forecasts
analyticsRouter.get(
  "/forecasts",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.listForecasts.bind(analyticsController),
);

analyticsRouter.post(
  "/forecasts/refresh",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.refreshForecasts.bind(analyticsController),
);

// Snapshots
analyticsRouter.get(
  "/snapshots",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.listSnapshots.bind(analyticsController),
);

analyticsRouter.post(
  "/snapshots",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.createSnapshot.bind(analyticsController),
);

analyticsRouter.delete(
  "/snapshots/:id",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.deleteSnapshot.bind(analyticsController),
);

// Custom reports
analyticsRouter.get(
  "/reports",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.listReports.bind(analyticsController),
);

analyticsRouter.post(
  "/reports",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.createReport.bind(analyticsController),
);

analyticsRouter.patch(
  "/reports/:id",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.updateReport.bind(analyticsController),
);

analyticsRouter.delete(
  "/reports/:id",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.deleteReport.bind(analyticsController),
);

analyticsRouter.post(
  "/reports/:id/execute",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.executeReport.bind(analyticsController),
);

analyticsRouter.get(
  "/reports/:id/executions",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.listReportExecutions.bind(analyticsController),
);

// Admin insights (gated to managers+ who already have analytics:read)
analyticsRouter.get(
  "/admin/insights",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.adminInsights.bind(analyticsController),
);

analyticsRouter.get(
  "/admin/queue-stats",
  requireAuth,
  requirePermission("analytics:read"),
  analyticsController.queueStats.bind(analyticsController),
);
