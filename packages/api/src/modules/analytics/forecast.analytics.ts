import { AgentActionStatus } from "@prisma/client";
import { linearRegression, linearRegressionLine } from "simple-statistics";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import type {
  ForecastEntityType,
  ForecastModel,
  ForecastPoint,
  ForecastRecord,
} from "./analytics.types.js";

/**
 * Forecast analytics — linear / polynomial / exponential projections
 * for project completion, agent success rate, and team throughput.
 *
 * Forecasts are cached in the `forecasts` table for `7 days` (the
 * `expiresAt` TTL). Subsequent calls within the window return the
 * cached predictions; calls past the window regenerate them.
 */
export class ForecastAnalyticsService {
  async listForecasts(
    orgId: string,
    opts: {
      entityType?: ForecastEntityType;
      entityId?: string;
      metric?: string;
    } = {},
  ): Promise<ForecastRecord[]> {
    const where: {
      orgId: string;
      expiresAt: { gt: Date };
      entityType?: string;
      entityId?: string;
      metric?: string;
    } = {
      orgId,
      expiresAt: { gt: new Date() },
    };
    if (opts.entityType) where.entityType = opts.entityType;
    if (opts.entityId) where.entityId = opts.entityId;
    if (opts.metric) where.metric = opts.metric;

    const rows = await prisma.forecast.findMany({
      where,
      orderBy: { generatedAt: "desc" },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      entityType: r.entityType as ForecastEntityType,
      entityId: r.entityId,
      metric: r.metric,
      model: r.model as ForecastModel,
      accuracy: r.accuracy,
      predictions: r.predictions as unknown as ForecastPoint[],
      generatedAt: r.generatedAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }));
  }

  /**
   * Build a fresh forecast for every project in the org whose cached
   * forecast is missing or expired. Returns the upserted list.
   */
  async generateProjectCompletionForecasts(
    orgId: string,
  ): Promise<ForecastRecord[]> {
    const projects = await prisma.projectReadModel.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        totalTasks: true,
        completedTasks: true,
      },
    });

    const created: ForecastRecord[] = [];
    for (const project of projects) {
      const completionRate =
        project.totalTasks > 0
          ? project.completedTasks / project.totalTasks
          : 0;
      // Already complete — no useful forecast.
      if (completionRate >= 1) continue;

      const historical = await this.fetchProjectThroughput(orgId, project.id);
      if (historical.length < 3) continue;

      const days = env.ANALYTICS_FORECAST_DAYS;
      const remaining = project.totalTasks - project.completedTasks;
      const result = this.linearForecast(historical, days);
      const expectedDaily =
        result.slope > 0 ? result.slope : result.lastValue / Math.max(1, historical.length);
      const etaDays = expectedDaily > 0 ? Math.ceil(remaining / expectedDaily) : days;
      const predictions: ForecastPoint[] = Array.from(
        { length: Math.min(etaDays, days) },
        (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i + 1);
          const predicted = Math.min(
            project.totalTasks,
            project.completedTasks + expectedDaily * (i + 1),
          );
          return {
            date: date.toISOString().slice(0, 10),
            predicted: Math.round(predicted * 10) / 10,
            confidence: Math.max(0.4, Math.min(0.95, result.r2)),
          };
        },
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const upserted = await prisma.forecast.upsert({
        where: { id: `${orgId}-${project.id}-completion_date` },
        create: {
          id: `${orgId}-${project.id}-completion_date`,
          orgId,
          entityType: "project",
          entityId: project.id,
          metric: "completion_date",
          predictions: predictions as unknown as object,
          model: "linear",
          accuracy: result.r2,
          expiresAt,
        },
        update: {
          predictions: predictions as unknown as object,
          model: "linear",
          accuracy: result.r2,
          generatedAt: new Date(),
          expiresAt,
        },
      });

      created.push({
        id: upserted.id,
        entityType: "project",
        entityId: project.id,
        metric: "completion_date",
        model: "linear",
        accuracy: result.r2,
        predictions,
        generatedAt: upserted.generatedAt.toISOString(),
        expiresAt: upserted.expiresAt.toISOString(),
      });
    }
    return created;
  }

  /**
   * Build agent success-rate forecasts. One per active agent.
   */
  async generateAgentSuccessForecasts(
    orgId: string,
  ): Promise<ForecastRecord[]> {
    const agents = await prisma.agentReadModel.findMany({
      where: { orgId, isActive: true },
      select: { id: true, name: true, successRate: true },
    });

    const created: ForecastRecord[] = [];
    for (const agent of agents) {
      const historical = await this.fetchAgentSuccess(orgId, agent.id);
      if (historical.length < 3) continue;
      const result = this.linearForecast(historical, 14);
      const predictions: ForecastPoint[] = result.predicted.map((p, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        return {
          date: date.toISOString().slice(0, 10),
          predicted: Math.max(0, Math.min(100, Math.round(p * 10) / 10)),
          confidence: Math.max(0.3, Math.min(0.95, result.r2)),
        };
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const upserted = await prisma.forecast.upsert({
        where: { id: `${orgId}-${agent.id}-success_rate` },
        create: {
          id: `${orgId}-${agent.id}-success_rate`,
          orgId,
          entityType: "agent",
          entityId: agent.id,
          metric: "success_rate",
          predictions: predictions as unknown as object,
          model: "linear",
          accuracy: result.r2,
          expiresAt,
        },
        update: {
          predictions: predictions as unknown as object,
          accuracy: result.r2,
          generatedAt: new Date(),
          expiresAt,
        },
      });

      created.push({
        id: upserted.id,
        entityType: "agent",
        entityId: agent.id,
        metric: "success_rate",
        model: "linear",
        accuracy: result.r2,
        predictions,
        generatedAt: upserted.generatedAt.toISOString(),
        expiresAt: upserted.expiresAt.toISOString(),
      });
    }
    return created;
  }

  private async fetchProjectThroughput(
    orgId: string,
    projectId: string,
  ): Promise<number[]> {
    const rows = await prisma.$queryRawUnsafe<Array<{ completed: number }>>(
      `SELECT COALESCE(tasks_completed, 0)::int as completed
       FROM task_velocity_daily
       WHERE org_id = $1
       ORDER BY bucket ASC
       LIMIT 30`,
      orgId,
    ).catch(() => [] as Array<{ completed: number }>);
    return rows.map((r) => Number(r.completed));
  }

  private async fetchAgentSuccess(
    orgId: string,
    agentId: string,
  ): Promise<number[]> {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const rows: Array<{ status: AgentActionStatus; createdAt: Date }> =
      await prisma.agentAction.findMany({
        where: { orgId, agentId, createdAt: { gte: since } },
        select: { status: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });
    // Bucket per day: [executed/total]
    const byDay = new Map<string, { executed: number; total: number }>();
    for (const r of rows) {
      const day = new Date(r.createdAt).toISOString().slice(0, 10);
      const b = byDay.get(day) ?? { executed: 0, total: 0 };
      b.total += 1;
      if (r.status === AgentActionStatus.EXECUTED) b.executed += 1;
      byDay.set(day, b);
    }
    return Array.from(byDay.values()).map((b) =>
      b.total > 0 ? (b.executed / b.total) * 100 : 100,
    );
  }

  private linearForecast(
    values: number[],
    daysAhead: number,
  ): { predicted: number[]; slope: number; r2: number; lastValue: number } {
    if (values.length < 2) {
      return {
        predicted: Array(daysAhead).fill(values[values.length - 1] ?? 0),
        slope: 0,
        r2: 0,
        lastValue: values[values.length - 1] ?? 0,
      };
    }
    const points: [number, number][] = values.map((v, i) => [i, v]);
    const regression = linearRegression(points);
    const line = linearRegressionLine(regression);

    // R² — coefficient of determination against actuals.
    const meanY = values.reduce((a, b) => a + b, 0) / values.length;
    let ssTot = 0;
    let ssRes = 0;
    for (let i = 0; i < values.length; i++) {
      ssTot += (values[i]! - meanY) ** 2;
      ssRes += (values[i]! - line(i)) ** 2;
    }
    const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

    const lastIndex = values.length - 1;
    const predicted: number[] = [];
    for (let i = 1; i <= daysAhead; i++) {
      predicted.push(line(lastIndex + i));
    }
    return {
      predicted,
      slope: regression.m,
      r2,
      lastValue: values[lastIndex]!,
    };
  }
}

export const forecastAnalyticsService = new ForecastAnalyticsService();
