/**
 * Phase 10 — Queue metrics collection.
 *
 * Collects per-queue statistics (waiting, active, completed, failed, etc.)
 * and stores them in Redis for the monitoring dashboard.
 */
import { QUEUES, QUEUE_DEFS } from "../../config/queues.js";
import { redisClient } from "../../config/redis.js";
import { env } from "../../config/env.js";

export interface QueueMetrics {
  name: string;
  description: string;
  color: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  avgProcessTime: number;
  health: "healthy" | "warning" | "critical";
}

export async function getQueueMetrics(): Promise<QueueMetrics[]> {
  const metrics: QueueMetrics[] = [];

  for (const [name, queue] of Object.entries(QUEUES)) {
    const counts = await queue.getJobCounts();
    const def = QUEUE_DEFS[name as keyof typeof QUEUE_DEFS];

    // Get average processing time from recent completed jobs
    const completedJobs = await queue.getJobs(["completed"], 0, 99, true);
    const processTimes = completedJobs
      .map((j) => {
        const started = j.processedOn ?? 0;
        const finished = j.finishedOn ?? 0;
        return finished > started ? finished - started : 0;
      })
      .filter((t) => t > 0);
    const avgProcessTime =
      processTimes.length > 0
        ? processTimes.reduce((a, b) => a + b) / processTimes.length
        : 0;

    // Determine health based on waiting queue size
    let health: "healthy" | "warning" | "critical" = "healthy";
    if (counts.waiting > env.QUEUE_ALERT_THRESHOLD_SIZE) {
      health = "critical";
    } else if (counts.waiting > env.QUEUE_ALERT_THRESHOLD_SIZE / 2) {
      health = "warning";
    }

    metrics.push({
      name,
      description: def?.description ?? "",
      color: def?.color ?? "#64748b",
      waiting: counts.waiting,
      active: counts.active,
      completed: await queue.getCompletedCount(),
      failed: counts.failed,
      delayed: counts.delayed,
      paused: counts.paused,
      avgProcessTime,
      health,
    });
  }

  return metrics;
}

export async function recordQueueMetrics(): Promise<void> {
  const metrics = await getQueueMetrics();

  const timestamp = Date.now();
  const key = `queue:metrics:${timestamp}`;

  await redisClient.set(key, JSON.stringify(metrics), "EX", 86400);

  await redisClient.lpush("queue:metrics:timestamps", timestamp.toString());
  await redisClient.ltrim("queue:metrics:timestamps", 0, 99);
}

export async function startMetricsCollection(): Promise<void> {
  const interval = env.QUEUE_METRICS_INTERVAL_MS;

  setInterval(async () => {
    try {
      await recordQueueMetrics();
    } catch (err) {
      console.error("[Queue] Metrics collection error:", err);
    }
  }, interval);

  console.log(`[Queue] Metrics collection started (every ${interval}ms)`);
}

export async function emitQueueMetrics(io: unknown): Promise<void> {
  const metrics = await getQueueMetrics();

  (io as any).emit("queue:metrics", {
    timestamp: new Date().toISOString(),
    queues: metrics,
  });
}

export async function getHistoricalMetrics(limit = 60): Promise<unknown[]> {
  const timestamps = await redisClient.lrange("queue:metrics:timestamps", 0, limit - 1);

  const results: unknown[] = [];
  for (const ts of timestamps) {
    const data = await redisClient.get(`queue:metrics:${ts}`);
    if (data) {
      results.push(JSON.parse(data));
    }
  }

  return results;
}
