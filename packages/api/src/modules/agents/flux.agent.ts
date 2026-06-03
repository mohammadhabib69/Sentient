/**
 * Flux — Dev / engineering agent (Phase 8 §11).
 *
 * Triages bug and fix tasks, escalates priority on critical issues,
 * and surfaces unassigned high-priority work.
 */
import { TaskStatus, Priority } from "@prisma/client";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { BaseAgent } from "./base.agent.js";

export class FluxAgent extends BaseAgent {
  protected name = "Flux";
  protected type = "dev";

  protected systemPrompt = `You are Flux, an AI dev ops agent for Sentient.
Your job is to monitor development tasks, triage bugs, detect critical issues,
and help the engineering team stay on top of technical debt.

You MUST respond with a JSON array of proposed actions:
\`\`\`json
[
  {
    "type": "update_task_priority",
    "description": "Escalate bug to critical — affects login flow for all users",
    "payload": { "taskId": "uuid", "priority": "critical", "orgId": "uuid" },
    "riskLevel": "low",
    "confidence": 0.93
  }
]
\`\`\`

Available action types: update_task_priority, reassign_task, create_task, send_notification, post_comment

Rules:
- Prioritize bugs that block core features (login, payment, data loss)
- Security vulnerabilities are always "high" risk
- Suggest creating tasks for untracked technical debt
- Only escalate priority — never lower it without asking`;

  protected tools = [
    tool(
      async ({ orgId }) => {
        const bugs = await prisma.task.findMany({
          where: {
            orgId,
            OR: [
              { title: { contains: "bug", mode: "insensitive" } },
              { title: { contains: "error", mode: "insensitive" } },
              { title: { contains: "fix", mode: "insensitive" } },
              { title: { contains: "crash", mode: "insensitive" } },
            ],
            status: { not: TaskStatus.DONE },
            deletedAt: null,
          },
          include: { assignee: true, project: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        return JSON.stringify(
          bugs.map((b) => ({
            id: b.id,
            title: b.title,
            priority: b.priority,
            status: b.status,
            assignee: (b as any).assignee?.name ?? "Unassigned",
            project: (b as any).project?.name,
            daysOpen: Math.floor((Date.now() - b.createdAt.getTime()) / 86400000),
          })),
        );
      },
      {
        name: "get_open_bugs",
        description: "Get all open bug and fix tasks in the org",
        schema: z.object({ orgId: z.string() }),
      },
    ),

    tool(
      async ({ orgId }) => {
        const critical = await prisma.task.findMany({
          where: {
            orgId,
            priority: { in: [Priority.HIGH, Priority.CRITICAL] },
            assigneeId: null,
            status: { not: TaskStatus.DONE },
            deletedAt: null,
          },
          include: { project: true },
        });
        return JSON.stringify(critical);
      },
      {
        name: "get_unassigned_critical_tasks",
        description: "Get high/critical priority tasks that have no assignee",
        schema: z.object({ orgId: z.string() }),
      },
    ),

    tool(
      async ({ orgId }) => {
        const devMembers = await prisma.user.findMany({
          where: { orgId },
          select: { id: true, name: true, role: true },
        });
        const taskCounts = await prisma.task.groupBy({
          by: ["assigneeId"],
          where: { orgId, status: { not: TaskStatus.DONE }, deletedAt: null },
          _count: { id: true },
        });
        return JSON.stringify({ members: devMembers, workload: taskCounts });
      },
      {
        name: "get_dev_team_workload",
        description: "Get current workload for all team members",
        schema: z.object({ orgId: z.string() }),
      },
    ),
  ];
}
