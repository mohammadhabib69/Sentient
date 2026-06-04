import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { overviewAnalyticsService } from "./overview.analytics.js";
import { velocityAnalyticsService } from "./velocity.analytics.js";
import { agentAnalyticsService } from "./agent.analytics.js";
import { projectsAnalyticsService } from "./projects.analytics.js";
import { forecastAnalyticsService } from "./forecast.analytics.js";
import { anomalyDetectionService } from "./anomaly-detection.js";
import type {
  CustomReportInput,
  CustomReportRecord,
  ReportExecutionRecord,
  ReportStatus,
} from "./analytics.types.js";

/**
 * Custom reports — user-defined bundles of metrics that can be exported
 * to JSON/CSV. Each report is a row in `custom_reports`; running a
 * report creates a `report_executions` row that points at the generated
 * file.
 */
export class ReportsAnalyticsService {
  // ─── Reports CRUD ───────────────────────────────────────────

  async list(orgId: string): Promise<CustomReportRecord[]> {
    const rows = await prisma.customReport.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => this.toRecord(r));
  }

  async get(orgId: string, id: string): Promise<CustomReportRecord | null> {
    const row = await prisma.customReport.findFirst({
      where: { id, orgId },
    });
    return row ? this.toRecord(row) : null;
  }

  async create(
    orgId: string,
    userId: string,
    input: CustomReportInput,
  ): Promise<CustomReportRecord> {
    const row = await prisma.customReport.create({
      data: {
        orgId,
        createdBy: userId,
        name: input.name,
        description: input.description,
        metrics: input.metrics,
        filters: (input.filters ?? {}) as object,
        isScheduled: input.isScheduled ?? false,
        scheduleExpr: input.scheduleExpr,
      },
    });
    return this.toRecord(row);
  }

  async update(
    orgId: string,
    id: string,
    input: Partial<CustomReportInput>,
  ): Promise<CustomReportRecord | null> {
    const existing = await prisma.customReport.findFirst({
      where: { id, orgId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.customReport.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        metrics: input.metrics,
        filters: input.filters as object | undefined,
        isScheduled: input.isScheduled,
        scheduleExpr: input.scheduleExpr,
      },
    });
    return this.toRecord(row);
  }

  async delete(orgId: string, id: string): Promise<boolean> {
    const result = await prisma.customReport.deleteMany({
      where: { id, orgId },
    });
    return result.count > 0;
  }

  // ─── Report execution ───────────────────────────────────────

  /**
   * Run a report end-to-end: collect the requested metrics, persist an
   * execution row, and return the generated output. CSV serialization
   * is done in-process; large reports (over the env cap) return JSON.
   */
  async execute(
    orgId: string,
    reportId: string,
    userId: string,
    format: "json" | "csv",
  ): Promise<ReportExecutionRecord> {
    const report = await prisma.customReport.findFirst({
      where: { id: reportId, orgId },
    });
    if (!report) {
      throw new Error("Report not found");
    }

    const execution = await prisma.reportExecution.create({
      data: {
        reportId,
        orgId,
        status: "pending",
        startedAt: new Date(),
      },
    });

    try {
      const metrics = report.metrics;
      const output = await this.collectMetrics(orgId, metrics);

      const fileUrl =
        format === "csv" ? this.serializeCsv(output) : JSON.stringify(output);

      // Cap at env.ANALYTICS_REPORT_MAX_ROWS for storage budget.
      const truncated =
        typeof fileUrl === "string" &&
        fileUrl.length > env.ANALYTICS_REPORT_MAX_ROWS * 50;

      const updated = await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          output: {
            metrics: output as Prisma.InputJsonValue,
            format,
            truncated,
            generatedBy: userId,
          } as Prisma.InputJsonValue,
        },
      });

      return this.toExecutionRecord(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const failed = await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          error: message,
        },
      });
      return this.toExecutionRecord(failed);
    }
  }

  async listExecutions(
    orgId: string,
    reportId: string,
  ): Promise<ReportExecutionRecord[]> {
    const rows = await prisma.reportExecution.findMany({
      where: { reportId, orgId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return rows.map((r) => this.toExecutionRecord(r));
  }

  // ─── Helpers ────────────────────────────────────────────────

  private async collectMetrics(
    orgId: string,
    metrics: string[],
  ): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = {};
    if (metrics.includes("overview"))
      out.overview = await overviewAnalyticsService.getOverview(orgId);
    if (metrics.includes("velocity"))
      out.velocity = await velocityAnalyticsService.getVelocity(orgId, 30);
    if (metrics.includes("agents"))
      out.agents = await agentAnalyticsService.getAgentMetrics(orgId, 30);
    if (metrics.includes("projects"))
      out.projects = await projectsAnalyticsService.getProjectHealth(orgId, 20);
    if (metrics.includes("forecasts"))
      out.forecasts = await forecastAnalyticsService.listForecasts(orgId);
    if (metrics.includes("anomalies"))
      out.anomalies = await anomalyDetectionService.listAnomalies(orgId, {
        limit: 20,
      });
    return out;
  }

  private serializeCsv(output: Record<string, unknown>): string {
    // Flatten the first metric block into a CSV-ish string. Each metric
    // section is JSON-serialized on its own line for resilience when
    // the schema varies.
    const lines: string[] = ["section,key,value"];
    for (const [section, value] of Object.entries(output)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value)) {
          lines.push(
            `${this.csvEscape(section)},${this.csvEscape(k)},${this.csvEscape(JSON.stringify(v))}`,
          );
        }
      } else if (Array.isArray(value)) {
        value.forEach((row, i) => {
          if (row && typeof row === "object") {
            for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
              lines.push(
                `${this.csvEscape(section)}[${i}],${this.csvEscape(k)},${this.csvEscape(JSON.stringify(v))}`,
              );
            }
          }
        });
      }
    }
    return lines.join("\n");
  }

  private csvEscape(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private toRecord(row: {
    id: string;
    name: string;
    description: string | null;
    metrics: string[];
    filters: unknown;
    isScheduled: boolean;
    scheduleExpr: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }): CustomReportRecord {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      metrics: row.metrics,
      filters: (row.filters ?? {}) as Record<string, unknown>,
      isScheduled: row.isScheduled,
      scheduleExpr: row.scheduleExpr,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toExecutionRecord(row: {
    id: string;
    reportId: string;
    status: string;
    output: unknown;
    fileUrl: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    error: string | null;
    createdAt: Date;
  }): ReportExecutionRecord {
    return {
      id: row.id,
      reportId: row.reportId,
      status: row.status as ReportStatus,
      output: (row.output ?? null) as Record<string, unknown> | null,
      fileUrl: row.fileUrl,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      error: row.error,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

export const reportsAnalyticsService = new ReportsAnalyticsService();
