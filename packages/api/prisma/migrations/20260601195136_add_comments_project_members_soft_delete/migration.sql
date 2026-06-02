/*
  Warnings:

  - The primary key for the `agent_actions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `agent_actions` table. All the data in the column will be lost.
  - You are about to drop the column `risk_level` on the `agent_actions` table. All the data in the column will be lost.
  - The `status` column on the `agent_actions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `approved_by` column on the `agent_actions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `agent_memory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `agents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `approval_mode` column on the `agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `actorType` on the `events` table. All the data in the column will be lost.
  - The primary key for the `files` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `notifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `organizations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `plan` column on the `organizations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `projects` table. All the data in the column will be lost.
  - The `status` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `subscriptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `plan` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `agent_assigned` on the `tasks` table. All the data in the column will be lost.
  - The `status` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `assignee_id` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `parent_task_id` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `estimated_hours` on the `tasks` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `webhooks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `workspaces` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `plugins` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[org_id,memory_ns]` on the table `agents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_cust_id]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_sub_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[org_id,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `id` on the `agent_actions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `agent_id` on the `agent_actions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `agent_actions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `expires_at` on table `agent_actions` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `agent_memory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `agent_id` on the `agent_memory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `embedding` on table `agent_memory` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `memory_ns` on table `agents` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `created_by` on the `agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `actor_type` to the `events` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `aggregate_id` on the `events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `actor_id` on the `events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `files` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `files` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `uploaded_by` on the `files` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `entity_id` on the `files` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `body` on table `notifications` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `organizations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `graph_node_id` on table `organizations` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `id` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `workspace_id` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `graph_node_id` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `created_by` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `subscriptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `subscriptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `tasks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `project_id` on the `tasks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `tasks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `graph_node_id` on table `tasks` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `created_by` on the `tasks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `webhooks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `webhooks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `workspaces` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `org_id` on the `workspaces` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `graph_node_id` on table `workspaces` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `created_by` on the `workspaces` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "plan" AS ENUM ('free', 'pro', 'business', 'enterprise');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('super_admin', 'org_admin', 'manager', 'member', 'guest');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('active', 'paused', 'archived', 'completed');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');

-- CreateEnum
CREATE TYPE "priority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "agent_type" AS ENUM ('operations', 'finance', 'customer', 'dev', 'custom');

-- CreateEnum
CREATE TYPE "approval_mode" AS ENUM ('always', 'auto_low_risk', 'never');

-- CreateEnum
CREATE TYPE "agent_action_status" AS ENUM ('pending', 'approved', 'rejected', 'executed', 'failed');

-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('user', 'agent', 'system');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'past_due', 'canceled', 'trialing');

-- DropForeignKey
ALTER TABLE "agent_actions" DROP CONSTRAINT "agent_actions_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_org_id_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_org_id_fkey";

-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_org_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_org_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_org_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignee_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_created_by_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_parent_task_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_project_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_org_id_fkey";

-- DropForeignKey
ALTER TABLE "webhooks" DROP CONSTRAINT "webhooks_org_id_fkey";

-- DropForeignKey
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_org_id_fkey";

-- DropIndex
DROP INDEX "agent_actions_agent_id_idx";

-- DropIndex
DROP INDEX "agent_actions_org_id_idx";

-- DropIndex
DROP INDEX "agent_actions_status_idx";

-- DropIndex
DROP INDEX "agent_memory_agent_id_idx";

-- DropIndex
DROP INDEX "agent_memory_embedding_idx";

-- DropIndex
DROP INDEX "agents_org_id_idx";

-- DropIndex
DROP INDEX "events_aggregate_id_idx";

-- DropIndex
DROP INDEX "events_occurred_at_idx";

-- DropIndex
DROP INDEX "events_org_id_idx";

-- DropIndex
DROP INDEX "files_entity_id_idx";

-- DropIndex
DROP INDEX "files_org_id_idx";

-- DropIndex
DROP INDEX "notifications_org_id_idx";

-- DropIndex
DROP INDEX "notifications_user_id_idx";

-- DropIndex
DROP INDEX "projects_org_id_idx";

-- DropIndex
DROP INDEX "projects_workspace_id_idx";

-- DropIndex
DROP INDEX "sessions_user_id_idx";

-- DropIndex
DROP INDEX "subscriptions_org_id_key";

-- DropIndex
DROP INDEX "tasks_assignee_id_idx";

-- DropIndex
DROP INDEX "tasks_org_id_idx";

-- DropIndex
DROP INDEX "tasks_project_id_idx";

-- DropIndex
DROP INDEX "tasks_status_idx";

-- DropIndex
DROP INDEX "users_email_org_id_key";

-- DropIndex
DROP INDEX "users_org_id_idx";

-- DropIndex
DROP INDEX "webhooks_org_id_idx";

-- AlterTable
ALTER TABLE "agent_actions" DROP CONSTRAINT "agent_actions_pkey",
DROP COLUMN "description",
DROP COLUMN "risk_level",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "agent_id",
ADD COLUMN     "agent_id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "agent_action_status" NOT NULL DEFAULT 'pending',
DROP COLUMN "approved_by",
ADD COLUMN     "approved_by" UUID,
ALTER COLUMN "approved_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "executed_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "expires_at" SET NOT NULL,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "agent_actions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "agent_memory" DROP CONSTRAINT "agent_memory_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "agent_id",
ADD COLUMN     "agent_id" UUID NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "embedding" SET NOT NULL,
ADD CONSTRAINT "agent_memory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "agents" DROP CONSTRAINT "agents_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "agent_type" NOT NULL,
ALTER COLUMN "memory_ns" SET NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT true,
DROP COLUMN "approval_mode",
ADD COLUMN     "approval_mode" "approval_mode" NOT NULL DEFAULT 'always',
DROP COLUMN "created_by",
ADD COLUMN     "created_by" UUID NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "events" DROP CONSTRAINT "events_pkey",
DROP COLUMN "actorType",
ADD COLUMN     "actor_type" "actor_type" NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
DROP COLUMN "aggregate_id",
ADD COLUMN     "aggregate_id" UUID NOT NULL,
DROP COLUMN "actor_id",
ADD COLUMN     "actor_id" UUID NOT NULL,
ALTER COLUMN "version" DROP DEFAULT,
ALTER COLUMN "occurred_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id", "occurred_at");

-- AlterTable
ALTER TABLE "files" DROP CONSTRAINT "files_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
DROP COLUMN "uploaded_by",
ADD COLUMN     "uploaded_by" UUID NOT NULL,
DROP COLUMN "entity_id",
ADD COLUMN     "entity_id" UUID NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
ALTER COLUMN "body" SET NOT NULL,
ALTER COLUMN "read_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "plan",
ADD COLUMN     "plan" "plan" NOT NULL DEFAULT 'free',
ALTER COLUMN "graph_node_id" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "projects" DROP CONSTRAINT "projects_pkey",
DROP COLUMN "description",
DROP COLUMN "updated_at",
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "workspace_id",
ADD COLUMN     "workspace_id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "project_status" NOT NULL DEFAULT 'active',
DROP COLUMN "priority",
ADD COLUMN     "priority" "priority" NOT NULL DEFAULT 'medium',
ALTER COLUMN "due_date" SET DATA TYPE DATE,
ALTER COLUMN "graph_node_id" SET NOT NULL,
DROP COLUMN "created_by",
ADD COLUMN     "created_by" UUID NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
DROP COLUMN "plan",
ADD COLUMN     "plan" "plan" NOT NULL DEFAULT 'free',
DROP COLUMN "status",
ADD COLUMN     "status" "subscription_status" NOT NULL DEFAULT 'active',
ALTER COLUMN "current_period_start" DROP DEFAULT,
ALTER COLUMN "current_period_start" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "current_period_end" DROP DEFAULT,
ALTER COLUMN "current_period_end" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_pkey",
DROP COLUMN "agent_assigned",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "project_id",
ADD COLUMN     "project_id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "task_status" NOT NULL DEFAULT 'todo',
DROP COLUMN "priority",
ADD COLUMN     "priority" "priority" NOT NULL DEFAULT 'medium',
DROP COLUMN "assignee_id",
ADD COLUMN     "assignee_id" UUID,
DROP COLUMN "parent_task_id",
ADD COLUMN     "parent_task_id" UUID,
ALTER COLUMN "due_date" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "estimated_hours" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "graph_node_id" SET NOT NULL,
DROP COLUMN "created_by",
ADD COLUMN     "created_by" UUID NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ADD COLUMN     "email_verify_expiry" TIMESTAMPTZ(6),
ADD COLUMN     "email_verify_token" TEXT,
ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locked_until" TIMESTAMPTZ(6),
ADD COLUMN     "reset_password_expiry" TIMESTAMPTZ(6),
ADD COLUMN     "reset_password_token" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'member',
ALTER COLUMN "last_active_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "webhooks" DROP CONSTRAINT "webhooks_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
ALTER COLUMN "last_triggered" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_pkey",
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "org_id",
ADD COLUMN     "org_id" UUID NOT NULL,
ALTER COLUMN "graph_node_id" SET NOT NULL,
DROP COLUMN "created_by",
ADD COLUMN     "created_by" UUID NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "plugins";

-- DropEnum
DROP TYPE "ActionStatus";

-- DropEnum
DROP TYPE "ActorType";

-- DropEnum
DROP TYPE "AgentType";

-- DropEnum
DROP TYPE "ApprovalMode";

-- DropEnum
DROP TYPE "Plan";

-- DropEnum
DROP TYPE "PluginStatus";

-- DropEnum
DROP TYPE "ProjectStatus";

-- DropEnum
DROP TYPE "TaskPriority";

-- DropEnum
DROP TYPE "TaskStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "task_comments" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_comments_task_id_idx" ON "task_comments"("task_id");

-- CreateIndex
CREATE INDEX "task_comments_org_id_idx" ON "task_comments"("org_id");

-- CreateIndex
CREATE INDEX "project_members_project_id_idx" ON "project_members"("project_id");

-- CreateIndex
CREATE INDEX "project_members_user_id_idx" ON "project_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "agent_actions_agent_id_status_idx" ON "agent_actions"("agent_id", "status");

-- CreateIndex
CREATE INDEX "agent_actions_org_id_status_created_at_idx" ON "agent_actions"("org_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "agent_actions_approved_by_idx" ON "agent_actions"("approved_by");

-- CreateIndex
CREATE INDEX "agent_actions_expires_at_idx" ON "agent_actions"("expires_at");

-- CreateIndex
CREATE INDEX "agent_memory_agent_id_namespace_idx" ON "agent_memory"("agent_id", "namespace");

-- CreateIndex
CREATE INDEX "agents_org_id_type_is_active_idx" ON "agents"("org_id", "type", "is_active");

-- CreateIndex
CREATE INDEX "agents_created_by_idx" ON "agents"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "agents_org_id_memory_ns_key" ON "agents"("org_id", "memory_ns");

-- CreateIndex
CREATE INDEX "events_org_id_occurred_at_idx" ON "events"("org_id", "occurred_at");

-- CreateIndex
CREATE INDEX "events_aggregate_type_aggregate_id_version_idx" ON "events"("aggregate_type", "aggregate_id", "version");

-- CreateIndex
CREATE INDEX "events_type_occurred_at_idx" ON "events"("type", "occurred_at");

-- CreateIndex
CREATE INDEX "files_org_id_entity_type_entity_id_idx" ON "files"("org_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "files_uploaded_by_idx" ON "files"("uploaded_by");

-- CreateIndex
CREATE INDEX "files_storage_key_idx" ON "files"("storage_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_created_at_idx" ON "notifications"("user_id", "read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_org_id_created_at_idx" ON "notifications"("org_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_cust_id_key" ON "organizations"("stripe_cust_id");

-- CreateIndex
CREATE INDEX "organizations_plan_idx" ON "organizations"("plan");

-- CreateIndex
CREATE INDEX "projects_workspace_id_status_idx" ON "projects"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "projects_org_id_status_idx" ON "projects"("org_id", "status");

-- CreateIndex
CREATE INDEX "projects_org_id_priority_idx" ON "projects"("org_id", "priority");

-- CreateIndex
CREATE INDEX "projects_due_date_idx" ON "projects"("due_date");

-- CreateIndex
CREATE INDEX "projects_created_by_idx" ON "projects"("created_by");

-- CreateIndex
CREATE INDEX "projects_deleted_at_idx" ON "projects"("deleted_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_revoked_idx" ON "sessions"("user_id", "revoked");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_sub_id_key" ON "subscriptions"("stripe_sub_id");

-- CreateIndex
CREATE INDEX "subscriptions_org_id_status_idx" ON "subscriptions"("org_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE INDEX "tasks_project_id_status_position_idx" ON "tasks"("project_id", "status", "position");

-- CreateIndex
CREATE INDEX "tasks_org_id_status_idx" ON "tasks"("org_id", "status");

-- CreateIndex
CREATE INDEX "tasks_org_id_priority_idx" ON "tasks"("org_id", "priority");

-- CreateIndex
CREATE INDEX "tasks_assignee_id_status_idx" ON "tasks"("assignee_id", "status");

-- CreateIndex
CREATE INDEX "tasks_parent_task_id_idx" ON "tasks"("parent_task_id");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "tasks_created_by_idx" ON "tasks"("created_by");

-- CreateIndex
CREATE INDEX "users_org_id_role_idx" ON "users"("org_id", "role");

-- CreateIndex
CREATE INDEX "users_last_active_at_idx" ON "users"("last_active_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_org_id_email_key" ON "users"("org_id", "email");

-- CreateIndex
CREATE INDEX "webhooks_org_id_is_active_idx" ON "webhooks"("org_id", "is_active");

-- CreateIndex
CREATE INDEX "webhooks_last_triggered_idx" ON "webhooks"("last_triggered");

-- CreateIndex
CREATE INDEX "workspaces_org_id_idx" ON "workspaces"("org_id");

-- CreateIndex
CREATE INDEX "workspaces_created_by_idx" ON "workspaces"("created_by");

-- CreateIndex
CREATE INDEX "workspaces_deleted_at_idx" ON "workspaces"("deleted_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_memory" ADD CONSTRAINT "agent_memory_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
