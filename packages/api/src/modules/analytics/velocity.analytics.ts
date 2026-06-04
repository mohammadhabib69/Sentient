import { TaskStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import type {
  ProjectionPoint,
  Trend,
  VelocityDay,
  VelocityMetrics,
} from "./analytics.types.js";

/**
 * Velocity analytics service — task completion trends, cycle time, throughput,
 * and a simple linear forecast over the next 14 days.
 *
 * Reads from the `task_velocity_daily` TimescaleDB continuous aggregate when
 * available; otherwise falls back to a direct aggregation over `events`.
 */
export class VelocityAnalyticsService {
  async getVelocity(orgId: string, days: number): Promise<VelocityMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyData = await this.fetchDailyData(orgId, startDate);

    const completed = dailyData.reduce((sum, d) => sum + d.completed, 0);
    const weeklyAverage = Math.round((completed / (days / 7)) * 100) / 100;

    const trend = this.computeTrend(dailyData);
    const cycleTime = await this.calculateCycleTime(orgId);
    const forecast = this.generateForecast(dailyData, 14);

    return {
      dailyData,
      weeklyAverage,
      trend,
      cycleTime,
      throughput: Math.round((completed / days) * 100) / 100,
      forecast,
    };
  }

  private async fetchDailyData(
    orgId: string,
    startDate: Date,
  ): Promise<VelocityDay[]> {
    // Prefer the continuous aggregate when present; fall back to a
    // direct query on the hypertable otherwise.
    try {
      const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT
           TO_CHAR(bucket, 'YYYY-MM-DD') as date,
           COALESCE(tasks_created, 0)::int   as created,
           COALESCE(tasks_completed, 0)::int as completed,
           COALESCE(tasks_blocked, 0)::int   as blocked
         FROM task_velocity_daily
         WHERE org_id = $1 AND bucket >= $2
         ORDER BY bucket ASC`,
        orgId,
        startDate,
      );
      return rows.map((r) => ({
        date: String(r.date),
        created: Number(r.created),
        completed: Number(r.completed),
        blocked: Number(r.blocked),
        inProgress: 0,
      }));
    } catch {
      return this.fetchDailyDataFromEvents(orgId, startDate);
    }
  }

  private async fetchDailyDataFromEvents(
    orgId: string,
    startDate: Date,
  ): Promise<VelocityDay[]> {
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT
         time_bucket('1 day', occurred_at) AS bucket,
         COUNT(*) FILTER (WHERE type = 'task.created')        AS created,
         COUNT(*) FILTER (WHERE type = 'task.status_changed'
           AND payload->>'to' = 'done')                       AS completed,
         COUNT(*) FILTER (WHERE type = 'task.status_changed'
           AND payload->>'to' = 'blocked')                    AS blocked
       FROM events
       WHERE org_id = $1
         AND occurred_at >= $2
         AND type IN ('task.created', 'task.status_changed')
       GROUP BY bucket
       ORDER BY bucket ASC`,
      orgId,
      startDate,
    );
    return rows.map((r) => ({
      date: new Date(r.bucket as Date).toISOString().slice(0, 10),
      created: Number(r.created),
      completed: Number(r.completed),
      blocked: Number(r.blocked),
      inProgress: 0,
    }));
  }

  private computeTrend(dailyData: VelocityDay[]): Trend {
    if (dailyData.length < 2) return "stable";
    const half = Math.floor(dailyData.length / 2);
    const first = dailyData.slice(0, half);
    const second = dailyData.slice(half);
    const firstAvg = first.reduce((sum, d) => sum + d.completed, 0) / first.length;
    const secondAvg = second.reduce((sum, d) => sum + d.completed, 0) / second.length;
    if (firstAvg === 0) return secondAvg > 0 ? "up" : "stable";
    if (secondAvg > firstAvg * 1.1) return "up";
    if (secondAvg < firstAvg * 0.9) return "down";
    return "stable";
  }

  private async calculateCycleTime(orgId: string): Promise<number> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000);
    const completed = await prisma.task.findMany({
      where: {
        orgId,
        status: TaskStatus.DONE,
        completedAt: { not: null },
        createdAt: { gte: ninetyDaysAgo },
      },
      select: { createdAt: true, completedAt: true },
      take: 100,
    });

    if (completed.length === 0) return 0;

    const cycleDays = completed
      .filter((t) => t.completedAt !== null)
      .map(
        (t) =>
          (t.completedAt!.getTime() - t.createdAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );

    if (cycleDays.length === 0) return 0;
    const avg = cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length;
    return Math.round(avg * 10) / 10;
  }

  private generateForecast(
    dailyData: VelocityDay[],
    daysAhead: number,
  ): ProjectionPoint[] {
    if (dailyData.length < 2) return [];

    const n = dailyData.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = dailyData.map((d) => d.completed);
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;

    const num = x.reduce(
      (sum, xi, i) => sum + (xi - meanX) * (y[i]! - meanY),
      0,
    );
    const den = x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0);
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;

    const last = new Date(dailyData[dailyData.length - 1]!.date);
    const forecast: ProjectionPoint[] = [];
    for (let i = 1; i <= daysAhead; i++) {
      const projected = new Date(last);
      projected.setDate(projected.getDate() + i);
      const value = Math.max(0, slope * (n + i - 1) + intercept);
      forecast.push({
        date: projected.toISOString().slice(0, 10),
        tasks: Math.round(value),
      });
    }
    return forecast;
  }
}

export const velocityAnalyticsService = new VelocityAnalyticsService();
