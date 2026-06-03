/**
 * Phase 10 — Queue admin routes.
 *
 * All endpoints require `queue:admin` permission (SUPER_ADMIN + ORG_ADMIN).
 */
import { Router } from "express";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import * as ctrl from "./queue.controller.js";

export const queueAdminRouter = Router();

// Require queue:admin permission on all routes
queueAdminRouter.use(requirePermission("queue:admin" as any));

// Queue metrics
queueAdminRouter.get("/metrics", ctrl.getMetrics);

// Queue job management
queueAdminRouter.get("/queue/:queueName/jobs", ctrl.getJobs);
queueAdminRouter.post("/queue/:queueName/jobs/:jobId/retry", ctrl.retryJobHandler);
queueAdminRouter.post("/queue/:queueName/jobs/:jobId/remove", ctrl.removeJobHandler);
queueAdminRouter.post("/queue/:queueName/pause", ctrl.pauseQueueHandler);
queueAdminRouter.post("/queue/:queueName/resume", ctrl.resumeQueueHandler);

// Dead letter queue
queueAdminRouter.get("/dead-letters", ctrl.getDLQJobs);
queueAdminRouter.post("/dead-letters/:id/retry", ctrl.retryDLQHandler);
