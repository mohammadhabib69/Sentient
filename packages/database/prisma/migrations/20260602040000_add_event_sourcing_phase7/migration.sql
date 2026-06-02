-- Phase 7: Event Sourcing + CQRS
-- Adds:
--   - outbox_status enum
--   - event_outbox + event_dead_letters tables
--   - 4 CQRS read-model tables (project, agent, org_metrics, user_activity)
--   - causation_id, correlation_id, idempotency_key columns on events
--   - supporting indexes

-- CreateEnum
CREATE TYPE "outbox_status" AS ENUM ('pending', 'delivered', 'failed', 'dead_lettered');

-- AlterTable (events)
ALTER TABLE "events"
  ADD COLUMN "causation_id" TEXT,
  ADD COLUMN "correlation_id" TEXT,
  ADD COLUMN "idempotency_key" TEXT;

-- CreateTable (event_outbox)
CREATE TABLE "event_outbox" (
    "id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "org_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "outbox_status" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_retry_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable (event_dead_letters)
CREATE TABLE "event_dead_letters" (
    "id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "org_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_dead_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable (project_read_models)
CREATE TABLE "project_read_models" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total_tasks" INTEGER NOT NULL DEFAULT 0,
    "completed_tasks" INTEGER NOT NULL DEFAULT 0,
    "in_progress_tasks" INTEGER NOT NULL DEFAULT 0,
    "blocked_tasks" INTEGER NOT NULL DEFAULT 0,
    "overdue_task_count" INTEGER NOT NULL DEFAULT 0,
    "health_score" INTEGER NOT NULL DEFAULT 100,
    "last_activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_event_version" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "project_read_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable (agent_read_models)
CREATE TABLE "agent_read_models" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "total_actions_all_time" BIGINT NOT NULL DEFAULT 0,
    "actions_today" INTEGER NOT NULL DEFAULT 0,
    "actions_this_week" INTEGER NOT NULL DEFAULT 0,
    "pending_approvals" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "last_action_at" TIMESTAMPTZ(6),
    "last_event_version" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "agent_read_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable (org_metrics_read_models)
CREATE TABLE "org_metrics_read_models" (
    "id" UUID NOT NULL,
    "active_tasks" INTEGER NOT NULL DEFAULT 0,
    "completed_tasks_today" INTEGER NOT NULL DEFAULT 0,
    "pending_approvals" INTEGER NOT NULL DEFAULT 0,
    "agent_actions_today" INTEGER NOT NULL DEFAULT 0,
    "online_users" INTEGER NOT NULL DEFAULT 0,
    "health_score" INTEGER NOT NULL DEFAULT 100,
    "last_event_version" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "org_metrics_read_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable (user_activity_read_models)
CREATE TABLE "user_activity_read_models" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tasks_created_today" INTEGER NOT NULL DEFAULT 0,
    "tasks_completed_today" INTEGER NOT NULL DEFAULT 0,
    "tasks_completed_week" INTEGER NOT NULL DEFAULT 0,
    "comments_today" INTEGER NOT NULL DEFAULT 0,
    "last_active_at" TIMESTAMPTZ(6),
    "last_event_version" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_activity_read_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_outbox_event_id_key" ON "event_outbox"("event_id");
CREATE INDEX "event_outbox_status_next_retry_at_idx" ON "event_outbox"("status", "next_retry_at");
CREATE INDEX "event_outbox_org_id_idx" ON "event_outbox"("org_id");
CREATE INDEX "event_dead_letters_org_id_idx" ON "event_dead_letters"("org_id");
CREATE INDEX "project_read_models_org_id_idx" ON "project_read_models"("org_id");
CREATE INDEX "agent_read_models_org_id_idx" ON "agent_read_models"("org_id");
CREATE INDEX "user_activity_read_models_org_id_idx" ON "user_activity_read_models"("org_id");
CREATE INDEX "events_idempotency_key_idx" ON "events"("idempotency_key");
CREATE INDEX "events_causation_id_idx" ON "events"("causation_id");
CREATE INDEX "events_correlation_id_idx" ON "events"("correlation_id");
