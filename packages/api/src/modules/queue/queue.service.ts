/**
 * Phase 10 — Queue operations service.
 *
 * Provides admin-level queue management: browse jobs by status,
 * retry/remove jobs, pause/resume queues.
 */
import { QUEUES } from "../../config/queues.js";
import type { JobState } from "bullmq";

export async function getQueueJobs(
  queueName: string,
  status: JobState,
  start: number,
  end: number,
): Promise<{
  jobs: Array<{
    id: string;
    name: string;
    status: string;
    data: Record<string, unknown>;
    attemptsMade: number;
    attemptsLimit: number;
    createdAt: number;
    processedOn?: number;
    finishedOn?: number;
    failedReason?: string;
    stacktrace?: string[];
  }>;
}> {
  const queue = QUEUES[queueName];
  if (!queue) throw new Error(`Queue not found: ${queueName}`);

  const jobs = await queue.getJobs([status], start, end, true);

  const jobData = await Promise.all(
    jobs.map(async (j) => ({
      id: j.id!,
      name: j.name,
      status: (await j.getState()) as string,
      data: j.data as Record<string, unknown>,
      attemptsMade: j.attemptsMade,
      attemptsLimit: j.opts.attempts ?? 3,
      createdAt: j.timestamp,
      processedOn: j.processedOn,
      finishedOn: j.finishedOn,
      failedReason: j.failedReason,
      stacktrace: j.stacktrace ?? [],
    })),
  );

  return { jobs: jobData };
}

export async function retryJob(
  queueName: string,
  jobId: string,
): Promise<void> {
  const queue = QUEUES[queueName];
  if (!queue) throw new Error(`Queue not found: ${queueName}`);

  const job = await queue.getJob(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);

  await job.retry();
}

export async function removeJob(
  queueName: string,
  jobId: string,
): Promise<void> {
  const queue = QUEUES[queueName];
  if (!queue) throw new Error(`Queue not found: ${queueName}`);

  const job = await queue.getJob(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);

  await job.remove();
}

export async function pauseQueue(queueName: string): Promise<void> {
  const queue = QUEUES[queueName];
  if (!queue) throw new Error(`Queue not found: ${queueName}`);

  await queue.pause();
}

export async function resumeQueue(queueName: string): Promise<void> {
  const queue = QUEUES[queueName];
  if (!queue) throw new Error(`Queue not found: ${queueName}`);

  await queue.resume();
}

export async function getQueueStats(queueName: string): Promise<Record<string, number>> {
  const queue = QUEUES[queueName];
  if (!queue) throw new Error(`Queue not found: ${queueName}`);

  return queue.getJobCounts();
}
