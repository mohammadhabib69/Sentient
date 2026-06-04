import { z } from "zod";

export const taskVelocityQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const agentPerformanceQuerySchema = z.object({
  agentId: z.string().uuid().optional(),
  days: z.coerce.number().int().min(1).max(365).default(7),
});

export const projectsHealthQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const anomaliesListQuerySchema = z.object({
  severity: z.enum(["low", "warning", "critical"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const anomalyIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const forecastsListQuerySchema = z.object({
  entityType: z.enum(["project", "agent", "team"]).optional(),
  entityId: z.string().uuid().optional(),
  metric: z.string().min(1).max(64).optional(),
});

export const snapshotCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  snapshotData: z.record(z.string(), z.unknown()).default({}),
});

export const snapshotListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const customReportCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  metrics: z.array(z.string().min(1).max(64)).min(1).max(20),
  filters: z.record(z.string(), z.unknown()).default({}),
  isScheduled: z.boolean().default(false),
  scheduleExpr: z.string().max(120).optional(),
});

export const customReportUpdateSchema = customReportCreateSchema.partial();

export const customReportIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const reportExecuteSchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
});

export type TaskVelocityQuery = z.infer<typeof taskVelocityQuerySchema>;
export type AgentPerformanceQuery = z.infer<typeof agentPerformanceQuerySchema>;
export type ProjectsHealthQuery = z.infer<typeof projectsHealthQuerySchema>;
export type AnomaliesListQuery = z.infer<typeof anomaliesListQuerySchema>;
export type AnomalyIdParam = z.infer<typeof anomalyIdParamSchema>;
export type ForecastsListQuery = z.infer<typeof forecastsListQuerySchema>;
export type SnapshotCreateInput = z.infer<typeof snapshotCreateSchema>;
export type SnapshotListQuery = z.infer<typeof snapshotListQuerySchema>;
export type CustomReportCreateInput = z.infer<typeof customReportCreateSchema>;
export type CustomReportUpdateInput = z.infer<typeof customReportUpdateSchema>;
export type CustomReportIdParam = z.infer<typeof customReportIdParamSchema>;
export type ReportExecuteInput = z.infer<typeof reportExecuteSchema>;
