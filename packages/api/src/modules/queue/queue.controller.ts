/**
 * Phase 10 — Queue admin controller.
 *
 * Thin controller wrapping queue service calls with standard
 * { success, data } response envelope.
 */
import type { Request, Response } from "express";
import { getQueueMetrics, getHistoricalMetrics } from "./queue-metrics.js";
import {
  getQueueJobs,
  retryJob,
  removeJob,
  pauseQueue,
  resumeQueue,
  getQueueStats,
} from "./queue.service.js";
import { retryDLQJob, listDLQJobs } from "./dead-letter.service.js";

export async function getMetrics(_req: Request, res: Response) {
  const metrics = await getQueueMetrics();
  const historical = await getHistoricalMetrics();

  res.json({
    success: true,
    data: {
      queues: metrics,
      historical,
    },
  });
}

export async function getJobs(req: Request, res: Response) {
  const { queueName } = req.params;
  const { status = "waiting", start = "0", end = "49" } = req.query;

  const result = await getQueueJobs(
    queueName as string,
    status as "waiting" | "active" | "completed" | "failed",
    parseInt(start as string),
    parseInt(end as string),
  );

  const stats = await getQueueStats(queueName as string);

  res.json({
    success: true,
    data: { ...result, stats },
  });
}

export async function retryJobHandler(req: Request, res: Response) {
  const { queueName, jobId } = req.params;

  await retryJob(queueName as string, jobId as string);

  res.json({
    success: true,
    data: { message: "Job retried" },
  });
}

export async function removeJobHandler(req: Request, res: Response) {
  const { queueName, jobId } = req.params;

  await removeJob(queueName as string, jobId as string);

  res.json({
    success: true,
    data: { message: "Job removed" },
  });
}

export async function pauseQueueHandler(req: Request, res: Response) {
  const { queueName } = req.params;

  await pauseQueue(queueName as string);

  res.json({
    success: true,
    data: { message: "Queue paused" },
  });
}

export async function resumeQueueHandler(req: Request, res: Response) {
  const { queueName } = req.params;

  await resumeQueue(queueName as string);

  res.json({
    success: true,
    data: { message: "Queue resumed" },
  });
}

export async function getDLQJobs(req: Request, res: Response) {
  const { queueName, cursor, limit } = req.query;

  const result = await listDLQJobs({
    queueName: queueName as string | undefined,
    cursor: cursor as string | undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  res.json({
    success: true,
    data: result,
  });
}

export async function retryDLQHandler(req: Request, res: Response) {
  const { id } = req.params;

  await retryDLQJob(id as string);

  res.json({
    success: true,
    data: { message: "DLQ job retried" },
  });
}
