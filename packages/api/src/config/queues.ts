/**
 * Phase 10 — Central queue registry.
 *
 * All BullMQ queues are created here with unified default options and
 * per-queue metadata (description, color, concurrency) for the dashboard.
 *
 * Exports individual queue instances for backward compat with existing
 * workers + a QUEUES map for metrics/dynamic lookup.
 */
import { Queue } from "bullmq";
import { bullRedisClient } from "./redis.js";
import { env } from "./env.js";
import { DEFAULT_QUEUE_OPTS } from "./queue-defaults.js";

// ─── Queue metadata ────────────────────────────────────────────────────

export const QUEUE_DEFS = {
  "ai-queue": {
    name: "ai-queue",
    description: "AI agent execution jobs",
    color: "#3b82f6",
    concurrency: env.WORKER_AI_CONCURRENCY,
    defaultAttempts: env.QUEUE_DEFAULT_ATTEMPTS,
  },
  "email-queue": {
    name: "email-queue",
    description: "Email sending jobs",
    color: "#10b981",
    concurrency: env.WORKER_EMAIL_CONCURRENCY,
    defaultAttempts: 5,
  },
  "pdf-queue": {
    name: "pdf-queue",
    description: "PDF generation jobs",
    color: "#f59e0b",
    concurrency: env.WORKER_PDF_CONCURRENCY,
    defaultAttempts: 3,
  },
  "schedule-queue": {
    name: "schedule-queue",
    description: "Scheduled/cron jobs",
    color: "#8b5cf6",
    concurrency: env.WORKER_SCHEDULE_CONCURRENCY,
    defaultAttempts: 1,
  },
  "webhook-queue": {
    name: "webhook-queue",
    description: "Outbound webhook delivery",
    color: "#ec4899",
    concurrency: 2,
    defaultAttempts: 5,
  },
  "graph-sync-queue": {
    name: "graph-sync-queue",
    description: "Neo4j graph synchronization",
    color: "#06b6d4",
    concurrency: 2,
    defaultAttempts: 3,
  },
  "notification-queue": {
    name: "notification-queue",
    description: "In-app notification delivery",
    color: "#a855f7",
    concurrency: 5,
    defaultAttempts: 3,
  },
  "billing-queue": {
    name: "billing-queue",
    description: "Stripe billing operations",
    color: "#6366f1",
    concurrency: 1,
    defaultAttempts: 3,
  },
  "session-cleanup-queue": {
    name: "session-cleanup-queue",
    description: "Expired session cleanup",
    color: "#64748b",
    concurrency: 1,
    defaultAttempts: 1,
  },
} as const;

// ─── Queue instances ────────────────────────────────────────────────────

export const aiQueue = new Queue("ai-queue", DEFAULT_QUEUE_OPTS);
export const emailQueue = new Queue("email-queue", DEFAULT_QUEUE_OPTS);
export const pdfQueue = new Queue("pdf-queue", DEFAULT_QUEUE_OPTS);
export const scheduleQueue = new Queue("schedule-queue", DEFAULT_QUEUE_OPTS);
export const webhookQueue = new Queue("webhook-queue", DEFAULT_QUEUE_OPTS);
export const graphSyncQueue = new Queue("graph-sync-queue", DEFAULT_QUEUE_OPTS);
export const notificationQueue = new Queue("notification-queue", DEFAULT_QUEUE_OPTS);
export const billingQueue = new Queue("billing-queue", DEFAULT_QUEUE_OPTS);
export const sessionCleanupQueue = new Queue("session-cleanup-queue", DEFAULT_QUEUE_OPTS);

// ─── Lookup map ─────────────────────────────────────────────────────────

export const QUEUES: Record<string, Queue> = {
  "ai-queue": aiQueue,
  "email-queue": emailQueue,
  "pdf-queue": pdfQueue,
  "schedule-queue": scheduleQueue,
  "webhook-queue": webhookQueue,
  "graph-sync-queue": graphSyncQueue,
  "notification-queue": notificationQueue,
  "billing-queue": billingQueue,
  "session-cleanup-queue": sessionCleanupQueue,
};

export async function getAllQueues(): Promise<Queue[]> {
  return Object.values(QUEUES);
}
