/**
 * Agent trigger registry (Phase 8 §6.1).
 *
 * Maps incoming events to agents. A trigger is a pure condition that
 * decides whether an agent should be woken up for a given event, plus
 * a `buildPrompt()` that gathers the context the agent will reason
 * over. The actual dispatch (enqueue to `ai-queue`) happens in
 * `trigger.processor.ts`.
 */
import { TaskStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import type { OutboxEventEnvelope } from "../../events/events.service.js";

export interface AgentTrigger {
  eventTypes: string[];
  agentType: string;
  shouldTrigger: (event: OutboxEventEnvelope) => Promise<boolean>;
  buildPrompt: (event: OutboxEventEnvelope) => Promise<string>;
}

export const AGENT_TRIGGERS: AgentTrigger[] = [
  // ─── Aria triggers ──────────────────────────────────────────────────────
  {
    eventTypes: ["task.status_changed"],
    agentType: "operations",
    shouldTrigger: async (event) => {
      const payload = event.payload as Record<string, unknown>;
      const changes = payload.changes as Record<string, { to: string }> | undefined;
      // Aria only wakes up when tasks become blocked.
      return changes?.status?.to === "blocked";
    },
    buildPrompt: async (event) => {
      const blockedTasks = await prisma.task.count({
        where: { orgId: event.orgId, status: TaskStatus.BLOCKED, deletedAt: null },
      });
      const overdueTasks = await prisma.task.findMany({
        where: {
          orgId: event.orgId,
          status: { not: TaskStatus.DONE },
          dueDate: { lt: new Date() },
          deletedAt: null,
        },
        include: { assignee: true },
        take: 5,
      });
      return `A task has been blocked. Org currently has ${blockedTasks} blocked tasks and ${overdueTasks.length} overdue tasks. Analyze the situation and propose actions to unblock or reassign tasks if needed. Overdue tasks: ${JSON.stringify(
        overdueTasks.map((t) => ({
          id: t.id,
          title: t.title,
          assignee: (t as any).assignee?.name,
          dueDate: t.dueDate,
        })),
      )}`;
    },
  },
  {
    eventTypes: ["task.created"],
    agentType: "operations",
    shouldTrigger: async (event) => {
      // Trigger when workload imbalance grows beyond 5 tasks.
      const memberTaskCounts = await prisma.task.groupBy({
        by: ["assigneeId"],
        where: { orgId: event.orgId, status: { not: TaskStatus.DONE }, deletedAt: null },
        _count: { id: true },
      });
      const counts = memberTaskCounts.map((m) => (m._count as any).id);
      if (counts.length < 2) return false;
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      return max - min > 5;
    },
    buildPrompt: async (event) => {
      const members = await prisma.user.findMany({
        where: { orgId: event.orgId },
        select: { id: true, name: true },
      });
      const taskCounts = await prisma.task.groupBy({
        by: ["assigneeId"],
        where: { orgId: event.orgId, status: { not: TaskStatus.DONE }, deletedAt: null },
        _count: { id: true },
      });
      return `New task created. Workload distribution: ${JSON.stringify(taskCounts)}. Team members: ${JSON.stringify(members)}. Analyze if workload is balanced and propose reassignments if needed.`;
    },
  },

  // ─── Nova triggers ─────────────────────────────────────────────────────
  {
    eventTypes: ["task.created"],
    agentType: "finance",
    shouldTrigger: async (event) => {
      const payload = event.payload as Record<string, unknown>;
      const title = ((payload.title as string) ?? "").toLowerCase();
      return (
        title.includes("invoice") ||
        title.includes("payment") ||
        title.includes("budget") ||
        title.includes("expense")
      );
    },
    buildPrompt: async (event) => {
      const payload = event.payload as Record<string, unknown>;
      return `A finance-related task was just created: "${payload.title}". Analyze if there are any financial anomalies, overdue invoices, or budget concerns that need attention. Propose appropriate actions.`;
    },
  },

  // ─── Echo triggers ─────────────────────────────────────────────────────
  {
    eventTypes: ["task.comment_added"],
    agentType: "customer",
    shouldTrigger: async (event) => {
      const payload = event.payload as Record<string, unknown>;
      const content = ((payload.contentPreview as string) ?? "").toLowerCase();
      const escalationKeywords = [
        "urgent",
        "angry",
        "disappointed",
        "cancel",
        "refund",
        "issue",
        "problem",
        "broken",
      ];
      return escalationKeywords.some((kw) => content.includes(kw));
    },
    buildPrompt: async (event) => {
      const payload = event.payload as Record<string, unknown>;
      return `A comment was added that may indicate a customer issue: "${payload.contentPreview}". Analyze the sentiment, determine severity, and propose whether escalation or a customer response is needed.`;
    },
  },

  // ─── Flux triggers ─────────────────────────────────────────────────────
  {
    eventTypes: ["task.created", "task.status_changed"],
    agentType: "dev",
    shouldTrigger: async (event) => {
      const payload = event.payload as Record<string, unknown>;
      const title = ((payload.title as string) ?? "").toLowerCase();
      return (
        title.includes("bug") ||
        title.includes("error") ||
        title.includes("crash") ||
        title.includes("fix")
      );
    },
    buildPrompt: async (event) => {
      const payload = event.payload as Record<string, unknown>;
      return `A bug/dev task was created or updated: "${payload.title}". Analyze the priority, check if similar bugs exist, and propose how to triage this effectively.`;
    },
  },
];
