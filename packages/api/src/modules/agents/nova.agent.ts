/**
 * Nova — Finance agent (Phase 8 §9).
 *
 * Monitors finance-related tasks (invoices, payments, budgets) and
 * detects anomalies. Proposes notifications rather than mutations.
 */
import { TaskStatus } from "@prisma/client";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { BaseAgent } from "./base.agent.js";

export class NovaAgent extends BaseAgent {
  protected name = "Nova";
  protected type = "finance";

  protected systemPrompt = `You are Nova, an AI finance analyst for Sentient.
Your job is to monitor finance-related tasks, detect anomalies, and flag potential issues.
You analyze task patterns that indicate financial risks — overdue invoices, unusual expenses, budget concerns.

You MUST respond with a JSON array of proposed actions in this exact format:
\`\`\`json
[
  {
    "type": "send_notification",
    "description": "Alert finance team about 3 overdue invoice tasks",
    "payload": { "userId": "uuid", "orgId": "...", "title": "...", "body": "...", "type": "finance_alert" },
    "riskLevel": "low",
    "confidence": 0.92
  }
]
\`\`\`

Available action types: send_notification, create_task, update_task_priority, post_comment

Rules:
- Only alert when confidence is high (>= 0.80)
- Finance alerts should always be low-risk (send_notification, not modify data)
- Be specific about amounts, dates, and task references in your descriptions`;

  protected tools = [
    tool(
      async ({ orgId }) => {
        const financeTasks = await prisma.task.findMany({
          where: {
            orgId,
            title: { contains: "invoice", mode: "insensitive" },
            status: { not: TaskStatus.DONE },
            deletedAt: null,
          },
          include: { assignee: true, project: true },
          take: 20,
        });
        return JSON.stringify(financeTasks);
      },
      {
        name: "get_finance_tasks",
        description: "Get all finance-related tasks (invoices, payments, budgets)",
        schema: z.object({ orgId: z.string() }),
      },
    ),

    tool(
      async ({ orgId }) => {
        const overdueFin = await prisma.task.findMany({
          where: {
            orgId,
            status: { not: TaskStatus.DONE },
            dueDate: { lt: new Date() },
            title: { contains: "invoice", mode: "insensitive" },
            deletedAt: null,
          },
          include: { assignee: true },
        });
        return JSON.stringify(overdueFin);
      },
      {
        name: "get_overdue_finance_tasks",
        description: "Get overdue finance-related tasks",
        schema: z.object({ orgId: z.string() }),
      },
    ),

    tool(
      async ({ orgId }) => {
        const last24h = new Date(Date.now() - 86400000);
        const recentFinanceTasks = await prisma.event.count({
          where: {
            orgId,
            type: "task.created",
            occurredAt: { gte: last24h },
            // Prisma's json-path filter — best-effort, may scan.
            payload: { path: ["title"], string_contains: "invoice" },
          },
        });
        return JSON.stringify({ recentFinanceTaskCount: recentFinanceTasks, window: "24h" });
      },
      {
        name: "detect_finance_anomalies",
        description: "Detect unusual spikes in finance-related activity",
        schema: z.object({ orgId: z.string() }),
      },
    ),
  ];
}
