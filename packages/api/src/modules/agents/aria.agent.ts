/**
 * Aria — Operations agent (Phase 8 §8).
 *
 * Monitors task deadlines, workload balance, and bottlenecks. Suggests
 * reassignments, priority changes, and notifications.
 */
import { TaskStatus } from "@prisma/client";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { BaseAgent } from "./base.agent.js";

export class AriaAgent extends BaseAgent {
  protected name = "Aria";
  protected type = "operations";

  protected systemPrompt = `You are Aria, an AI operations manager for Sentient.
Your job is to monitor task management, team workload, project health, and deadlines.
You observe patterns, detect problems early, and propose concrete actions.

You MUST respond with a JSON array of proposed actions in this exact format:
\`\`\`json
[
  {
    "type": "reassign_task",
    "description": "Reassign task X from John to Sarah because John is overloaded",
    "payload": { "taskId": "uuid", "newAssigneeId": "uuid", "newAssigneeName": "Sarah", "reason": "...", "orgId": "uuid", "agentId": "uuid" },
    "riskLevel": "low",
    "confidence": 0.87
  }
]
\`\`\`

Available action types: reassign_task, update_task_priority, update_task_due_date, create_task, send_notification, flag_overdue_project, update_task_status, post_comment

Rules:
- Only propose actions you are confident about (confidence >= 0.7)
- Prefer low-risk actions (reassign, notify) over high-risk (delete, close project)
- Always explain the reasoning in the description
- If no action is needed, return an empty array []`;

  protected tools = [
    tool(
      async ({ orgId }) => {
        const overdueTasks = await prisma.task.findMany({
          where: {
            orgId,
            status: { not: TaskStatus.DONE },
            dueDate: { lt: new Date() },
            deletedAt: null,
          },
          include: { assignee: true, project: true },
          take: 20,
        });
        return JSON.stringify(
          overdueTasks.map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            assignee: (t as any).assignee?.name ?? "Unassigned",
            project: (t as any).project?.name,
            priority: t.priority,
            daysOverdue: Math.floor(
              (Date.now() - (t.dueDate?.getTime() ?? 0)) / 86400000,
            ),
          })),
        );
      },
      {
        name: "get_overdue_tasks",
        description: "Get all overdue tasks in the organization",
        schema: z.object({ orgId: z.string() }),
      },
    ),

    tool(
      async ({ orgId }) => {
        const memberTaskCounts = await prisma.task.groupBy({
          by: ["assigneeId"],
          where: { orgId, status: { not: TaskStatus.DONE }, deletedAt: null },
          _count: { id: true },
        });
        const users = await prisma.user.findMany({
          where: { orgId },
          select: { id: true, name: true, role: true },
        });
        return JSON.stringify(
          memberTaskCounts.map((m) => ({
            ...m,
            user: users.find((u) => u.id === m.assigneeId),
          })),
        );
      },
      {
        name: "get_workload_distribution",
        description: "Get task counts per team member to detect workload imbalance",
        schema: z.object({ orgId: z.string() }),
      },
    ),

    tool(
      async ({ orgId }) => {
        const blockedTasks = await prisma.task.findMany({
          where: { orgId, status: TaskStatus.BLOCKED, deletedAt: null },
          include: { assignee: true, project: true },
          take: 10,
        });
        return JSON.stringify(blockedTasks);
      },
      {
        name: "get_blocked_tasks",
        description: "Get all currently blocked tasks",
        schema: z.object({ orgId: z.string() }),
      },
    ),

    tool(
      async ({ orgId }) => {
        const projects = await prisma.projectReadModel.findMany({
          where: { orgId },
        });
        return JSON.stringify(projects);
      },
      {
        name: "get_project_health",
        description: "Get health scores and task counts for all projects",
        schema: z.object({ orgId: z.string() }),
      },
    ),

    tool(
      async ({ orgId, userId }) => {
        const tasks = await prisma.task.findMany({
          where: { orgId, assigneeId: userId, status: { not: TaskStatus.DONE }, deletedAt: null },
          orderBy: { dueDate: "asc" },
        });
        return JSON.stringify(tasks);
      },
      {
        name: "get_user_tasks",
        description: "Get all open tasks for a specific team member",
        schema: z.object({ orgId: z.string(), userId: z.string() }),
      },
    ),
  ];
}
