/**
 * Phase 10 — Dead letter queue service.
 *
 * Stores failed jobs after max retries for later inspection and retry.
 */
import { QUEUES } from "../../config/queues.js";
import { prisma } from "../../config/prisma.js";

export async function moveJobToDLQ(
  queueName: string,
  jobId: string,
  error: Error,
): Promise<void> {
  const queue = QUEUES[queueName];
  if (!queue) return;

  const job = await queue.getJob(jobId);
  if (!job) return;

  await prisma.deadLetterJob.create({
    data: {
      queueName,
      jobId,
      jobType: job.name,
      jobData: job.data as any,
      error: error.message,
      errorStack: error.stack ?? null,
      attempts: job.attemptsMade,
    },
  });

  console.log(`[DLQ] Job moved to dead letter: ${queueName}/${jobId}`);
}

export async function retryDLQJob(dlqId: string): Promise<void> {
  const dlq = await prisma.deadLetterJob.findFirst({
    where: { id: dlqId },
  });
  if (!dlq) throw new Error("DLQ entry not found");

  const queue = QUEUES[dlq.queueName];
  if (!queue) throw new Error(`Queue not found: ${dlq.queueName}`);

  await queue.add(dlq.jobType, dlq.jobData as Record<string, unknown>, {
    attempts: 3,
    priority: 5,
  });

  await prisma.deadLetterJob.delete({ where: { id: dlqId } });

  console.log(`[DLQ] Job retried: ${dlq.queueName}/${dlq.jobId}`);
}

export async function listDLQJobs(params?: {
  cursor?: string;
  limit?: number;
  queueName?: string;
}): Promise<{
  jobs: Array<{
    id: string;
    queueName: string;
    jobId: string;
    jobType: string;
    error: string;
    attempts: number;
    createdAt: Date;
  }>;
  total: number;
}> {
  const limit = Math.max(1, Math.min(params?.limit ?? 50, 200));
  const where: Record<string, unknown> = {};
  if (params?.queueName) where.queueName = params.queueName;

  const [jobs, total] = await Promise.all([
    prisma.deadLetterJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(params?.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    }),
    prisma.deadLetterJob.count({ where }),
  ]);

  const hasMore = jobs.length > limit;
  const trimmedJobs = hasMore ? jobs.slice(0, limit) : jobs;

  return {
    jobs: trimmedJobs.map((j) => ({
      id: j.id,
      queueName: j.queueName,
      jobId: j.jobId,
      jobType: j.jobType,
      error: j.error,
      attempts: j.attempts,
      createdAt: j.createdAt,
    })),
    total,
  };
}
