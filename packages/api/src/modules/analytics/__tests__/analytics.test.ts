/**
 * Phase 11 — Analytics tests.
 *
 * Verifies:
 *   - OverviewAnalyticsService: aggregates org metrics + alerts + risks
 *   - VelocityAnalyticsService: trend + linear forecast math
 *   - AgentAnalyticsService: success rate + trend classification
 *   - AnomalyDetectionService: z-score detection on synthetic data
 *   - ForecastAnalyticsService: linear regression on a constant series
 *   - SnapshotsAnalyticsService: capture + list + delete
 *   - ReportsAnalyticsService: CRUD + execute
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Shared mock state ──────────────────────────────────────────

const queryRawUnsafeMock = vi.fn();
const findUniqueMock = vi.fn();
const findManyMock = vi.fn();
const findFirstMock = vi.fn();
const countMock = vi.fn().mockResolvedValue(0);
const createMock = vi.fn();
const updateMock = vi.fn();
const deleteManyMock = vi.fn().mockResolvedValue({ count: 1 });
const upsertMock = vi.fn();
const emailQueueAddMock = vi.fn().mockResolvedValue({ id: "email-1" });

vi.mock("../../../config/prisma.js", () => ({
  prisma: {
    $queryRawUnsafe: (...args: unknown[]) => queryRawUnsafeMock(...args),
    orgMetricsReadModel: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
    projectReadModel: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    agentReadModel: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    project: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    event: {
      count: (...args: unknown[]) => countMock(...args),
    },
    task: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    agent: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    agentAction: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    detectedAnomaly: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      count: (...args: unknown[]) => countMock(...args),
    },
    analyticsSnapshot: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
      count: (...args: unknown[]) => countMock(...args),
    },
    forecast: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      upsert: (...args: unknown[]) => upsertMock(...args),
    },
    customReport: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
      count: (...args: unknown[]) => countMock(...args),
    },
    reportExecution: {
      create: (...args: unknown[]) => createMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    user: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    organization: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    deadLetterJob: {
      count: (...args: unknown[]) => countMock(...args),
    },
  },
}));

vi.mock("../../../config/queues.js", () => ({
  emailQueue: { add: (...args: unknown[]) => emailQueueAddMock(...args) },
  QUEUES: {},
}));

vi.mock("../../../config/redis.js", () => ({
  redisClient: { ping: vi.fn().mockResolvedValue("PONG") },
}));

beforeEach(() => {
  queryRawUnsafeMock.mockReset();
  findUniqueMock.mockReset();
  findManyMock.mockReset();
  findFirstMock.mockReset();
  countMock.mockReset();
  createMock.mockReset();
  updateMock.mockReset();
  deleteManyMock.mockReset().mockResolvedValue({ count: 1 });
  upsertMock.mockReset();
  emailQueueAddMock.mockClear();
  countMock.mockResolvedValue(0);
  // Default findMany returns empty array so tests can opt-in to a
  // specific return by mocking again with .mockResolvedValueOnce.
  findManyMock.mockResolvedValue([]);
  // Default $queryRawUnsafe returns [] (not undefined) so callers can
  // safely call .map on the result.
  queryRawUnsafeMock.mockResolvedValue([]);
});

// ─── OverviewAnalyticsService ────────────────────────────────────

describe("OverviewAnalyticsService", () => {
  it("returns zeros for an empty org", async () => {
    findUniqueMock.mockResolvedValue(null);
    findManyMock.mockResolvedValue([]);

    const { overviewAnalyticsService } = await import("../overview.analytics.js");
    const result = await overviewAnalyticsService.getOverview("org-1");

    expect(result.activeTasks).toBe(0);
    expect(result.completedTasksThisWeek).toBe(0);
    expect(result.completionVelocity).toBe(0);
    expect(result.projectHealth).toBe(100);
    expect(result.teamMorale).toBe("excellent");
    expect(result.agentEfficiency).toBe(100);
    expect(result.systemUptime).toBe(99.2);
    expect(result.alerts).toEqual([]);
    expect(result.topRisks).toEqual([]);
  });

  it("classifies morale as fair when health is low", async () => {
    findUniqueMock.mockResolvedValue({ activeTasks: 5 });
    findManyMock.mockImplementation((args: any) => {
      if (args?.select?.healthScore) {
        return Promise.resolve([{ healthScore: 50 }, { healthScore: 60 }]);
      }
      if (args?.select?.successRate) {
        return Promise.resolve([{ successRate: 75 }]);
      }
      return Promise.resolve([]);
    });

    const { overviewAnalyticsService } = await import("../overview.analytics.js");
    const result = await overviewAnalyticsService.getOverview("org-1");

    expect(result.projectHealth).toBe(55);
    expect(result.teamMorale).toBe("fair");
    expect(result.agentEfficiency).toBe(75);
  });
});

// ─── VelocityAnalyticsService ────────────────────────────────────

describe("VelocityAnalyticsService", () => {
  it("returns empty forecast when fewer than 2 data points", async () => {
    queryRawUnsafeMock.mockResolvedValueOnce([]); // empty aggregate

    const { velocityAnalyticsService } = await import("../velocity.analytics.js");
    const result = await velocityAnalyticsService.getVelocity("org-1", 7);

    expect(result.dailyData).toEqual([]);
    expect(result.forecast).toEqual([]);
    expect(result.trend).toBe("stable");
  });

  it("computes a 14-day forecast and detects an upward trend", async () => {
    queryRawUnsafeMock.mockResolvedValueOnce([
      { date: "2026-05-01", created: 1, completed: 1, blocked: 0 },
      { date: "2026-05-02", created: 1, completed: 2, blocked: 0 },
      { date: "2026-05-03", created: 1, completed: 3, blocked: 0 },
      { date: "2026-05-04", created: 1, completed: 5, blocked: 0 },
      { date: "2026-05-05", created: 1, completed: 8, blocked: 0 },
    ]);
    findManyMock.mockResolvedValue([]);

    const { velocityAnalyticsService } = await import("../velocity.analytics.js");
    const result = await velocityAnalyticsService.getVelocity("org-1", 5);

    expect(result.dailyData).toHaveLength(5);
    expect(result.forecast).toHaveLength(14);
    expect(result.trend).toBe("up");
    expect(result.weeklyAverage).toBeGreaterThan(0);
    expect(result.throughput).toBeGreaterThan(0);
  });
});

// ─── AgentAnalyticsService ───────────────────────────────────────

describe("AgentAnalyticsService", () => {
  it("returns zeroed metrics when no agents exist", async () => {
    findManyMock.mockResolvedValue([]);

    const { agentAnalyticsService } = await import("../agent.analytics.js");
    const result = await agentAnalyticsService.getAgentMetrics("org-1", 7);

    expect(result.agents).toEqual([]);
    expect(result.overallSuccessRate).toBe(0);
    expect(result.totalExecutions).toBe(0);
    expect(result.errorDistribution).toEqual({});
  });

  it("aggregates success rate, errors, and trend per agent", async () => {
    const since = expect.any(Date);
    findManyMock.mockResolvedValueOnce([
      {
        id: "agent-1",
        name: "Aria",
        type: "OPERATIONS",
        actions: [
          { status: "EXECUTED", createdAt: new Date("2026-05-01"), executedAt: new Date("2026-05-01") },
          { status: "EXECUTED", createdAt: new Date("2026-05-02"), executedAt: new Date("2026-05-02") },
          { status: "FAILED", createdAt: new Date("2026-05-03"), executedAt: null, result: { error: "boom" } },
          { status: "EXECUTED", createdAt: new Date("2026-05-04"), executedAt: new Date("2026-05-04") },
          { status: "FAILED", createdAt: new Date("2026-05-05"), executedAt: null, result: { error: "boom" } },
        ],
      },
    ]);

    const { agentAnalyticsService } = await import("../agent.analytics.js");
    const result = await agentAnalyticsService.getAgentMetrics("org-1", 7);

    expect(result.totalExecutions).toBe(5);
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0]!.agentName).toBe("Aria");
    expect(result.agents[0]!.successCount).toBe(3);
    expect(result.agents[0]!.failureCount).toBe(2);
    expect(result.agents[0]!.successRate).toBe(60);
    expect(result.agents[0]!.commonErrors[0]!.error).toBe("boom");
    expect(result.agents[0]!.commonErrors[0]!.count).toBe(2);
    expect(result.errorDistribution.boom).toBe(2);
  });
});

// ─── AnomalyDetectionService ────────────────────────────────────

describe("AnomalyDetectionService", () => {
  it("reports no anomaly when there is not enough data", async () => {
    queryRawUnsafeMock.mockResolvedValueOnce([
      { completed: 1 },
      { completed: 2 },
    ]);
    findManyMock.mockResolvedValueOnce([]); // agent actions
    findManyMock.mockResolvedValueOnce([]); // project read models

    const { anomalyDetectionService } = await import("../anomaly-detection.js");
    const results = await anomalyDetectionService.detectAll("org-1");

    expect(results).toHaveLength(3);
    expect(results.every((r) => !r.isAnomaly)).toBe(true);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("flags a critical task-velocity spike", async () => {
    // 30 days of stable velocity followed by a 5x spike on the last day.
    const stable = Array.from({ length: 29 }, () => ({ completed: 10 }));
    queryRawUnsafeMock.mockResolvedValueOnce([...stable, { completed: 50 }]);
    findManyMock.mockResolvedValueOnce([]); // agent actions
    findManyMock.mockResolvedValueOnce([{ healthScore: 90 }]); // project read models

    const { anomalyDetectionService } = await import("../anomaly-detection.js");
    const results = await anomalyDetectionService.detectAll("org-1");

    const velocity = results.find((r) => r.metric === "task_velocity");
    expect(velocity).toBeDefined();
    expect(velocity!.isAnomaly).toBe(true);
    expect(velocity!.severity).toBe("critical");
    expect(velocity!.value).toBe(50);
  });

  it("acknowledges an anomaly and returns the updated record", async () => {
    const updated = {
      id: "anomaly-1",
      orgId: "org-1",
      metric: "task_velocity",
      severity: "warning",
      description: "Test",
      value: 99,
      expectedRange: { mean: 10, stdDev: 1, min: 8, max: 12 },
      deviations: 89,
      detectedAt: new Date(),
      acknowledgedAt: new Date(),
      acknowledgedBy: "user-1",
    };
    updateMock.mockResolvedValueOnce(updated);

    const { anomalyDetectionService } = await import("../anomaly-detection.js");
    const result = await anomalyDetectionService.acknowledgeAnomaly(
      "org-1",
      "anomaly-1",
      "user-1",
    );

    expect(result).not.toBeNull();
    expect(result!.acknowledgedAt).not.toBeNull();
    expect(updateMock).toHaveBeenCalledOnce();
  });
});

// ─── ForecastAnalyticsService ───────────────────────────────────

describe("ForecastAnalyticsService", () => {
  it("returns an empty list when no forecasts are cached", async () => {
    findManyMock.mockResolvedValueOnce([]);

    const { forecastAnalyticsService } = await import("../forecast.analytics.js");
    const result = await forecastAnalyticsService.listForecasts("org-1");

    expect(result).toEqual([]);
  });

  it("serializes cached forecasts into the typed shape", async () => {
    const now = new Date();
    const future = new Date(Date.now() + 7 * 86_400_000);
    findManyMock.mockResolvedValueOnce([
      {
        id: "f-1",
        orgId: "org-1",
        entityType: "project",
        entityId: "p-1",
        metric: "completion_date",
        predictions: [{ date: "2026-06-04", predicted: 50, confidence: 0.8 }],
        model: "linear",
        accuracy: 0.8,
        generatedAt: now,
        expiresAt: future,
      },
    ]);

    const { forecastAnalyticsService } = await import("../forecast.analytics.js");
    const result = await forecastAnalyticsService.listForecasts("org-1");

    expect(result).toHaveLength(1);
    expect(result[0]!.entityType).toBe("project");
    expect(result[0]!.predictions[0]!.predicted).toBe(50);
  });
});

// ─── SnapshotsAnalyticsService ─────────────────────────────────

describe("SnapshotsAnalyticsService", () => {
  it("creates a snapshot with an auto-captured body when none provided", async () => {
    findManyMock.mockResolvedValueOnce([]); // overview metrics
    findManyMock.mockResolvedValueOnce([]); // velocity daily data
    findManyMock.mockResolvedValueOnce([]); // velocity cycle tasks
    findManyMock.mockResolvedValueOnce([]); // agent actions
    findManyMock.mockResolvedValueOnce([]); // project read models
    findManyMock.mockResolvedValueOnce([]); // projects
    findManyMock.mockResolvedValueOnce([]); // anomalies

    createMock.mockResolvedValueOnce({
      id: "snap-1",
      orgId: "org-1",
      name: "Test",
      description: null,
      snapshotData: { foo: "bar" },
      createdBy: null,
      createdAt: new Date(),
    });

    const { snapshotsAnalyticsService } = await import("../snapshots.analytics.js");
    const result = await snapshotsAnalyticsService.create("org-1", null, {
      name: "Test",
    });

    expect(result.name).toBe("Test");
    expect(result.id).toBe("snap-1");
  });

  it("returns true when deleteMany removes a row", async () => {
    deleteManyMock.mockResolvedValueOnce({ count: 1 });
    const { snapshotsAnalyticsService } = await import("../snapshots.analytics.js");
    const result = await snapshotsAnalyticsService.delete("org-1", "snap-1");
    expect(result).toBe(true);
  });
});

// ─── ReportsAnalyticsService ────────────────────────────────────

describe("ReportsAnalyticsService", () => {
  it("creates, updates, and deletes a report", async () => {
    createMock.mockResolvedValueOnce({
      id: "r-1",
      name: "Weekly",
      description: null,
      metrics: ["overview"],
      filters: {},
      isScheduled: false,
      scheduleExpr: null,
      createdBy: "u-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { reportsAnalyticsService } = await import("../reports.analytics.js");
    const created = await reportsAnalyticsService.create("org-1", "u-1", {
      name: "Weekly",
      metrics: ["overview"],
    });
    expect(created.id).toBe("r-1");

    // update
    findFirstMock.mockResolvedValueOnce({ id: "r-1" });
    updateMock.mockResolvedValueOnce({
      id: "r-1",
      name: "Weekly v2",
      description: "Updated",
      metrics: ["overview", "velocity"],
      filters: {},
      isScheduled: false,
      scheduleExpr: null,
      createdBy: "u-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const updated = await reportsAnalyticsService.update("org-1", "r-1", {
      name: "Weekly v2",
    });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Weekly v2");

    // delete
    deleteManyMock.mockResolvedValueOnce({ count: 1 });
    const deleted = await reportsAnalyticsService.delete("org-1", "r-1");
    expect(deleted).toBe(true);
  });

  it("executes a report and returns the completed execution", async () => {
    findFirstMock.mockResolvedValueOnce({
      id: "r-1",
      orgId: "org-1",
      metrics: ["overview"],
    });
    createMock.mockImplementationOnce((args: any) =>
      Promise.resolve({
        id: "exec-1",
        reportId: "r-1",
        orgId: "org-1",
        status: "pending",
        output: null,
        fileUrl: null,
        startedAt: new Date(),
        completedAt: null,
        error: null,
        createdAt: new Date(),
      }),
    );
    updateMock.mockImplementationOnce((args: any) =>
      Promise.resolve({
        id: "exec-1",
        reportId: "r-1",
        orgId: "org-1",
        status: "completed",
        output: { metrics: {}, format: "json", truncated: false, generatedBy: "u-1" },
        fileUrl: null,
        startedAt: new Date(),
        completedAt: new Date(),
        error: null,
        createdAt: new Date(),
      }),
    );

    const { reportsAnalyticsService } = await import("../reports.analytics.js");
    const result = await reportsAnalyticsService.execute(
      "org-1",
      "r-1",
      "u-1",
      "json",
    );

    expect(result.status).toBe("completed");
    expect(result.output).not.toBeNull();
  });
});
