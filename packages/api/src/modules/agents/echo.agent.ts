/**
 * Echo — Customer agent (Phase 8 §10).
 *
 * Analyzes customer-related comments for negative sentiment and
 * proposes escalation. Uses OpenAI's chat completion for sentiment
 * classification.
 */
import { TaskStatus } from "@prisma/client";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { BaseAgent } from "./base.agent.js";
import { CHAT_MODEL, getOpenAIClient } from "../../config/openai.js";

export class EchoAgent extends BaseAgent {
  protected name = "Echo";
  protected type = "customer";

  protected systemPrompt = `You are Echo, an AI customer success agent for Sentient.
Your job is to analyze customer-related tasks and comments, detect negative sentiment,
and propose escalation or response actions before issues grow.

You MUST respond with a JSON array of proposed actions:
\`\`\`json
[
  {
    "type": "post_comment",
    "description": "Add follow-up note to customer issue task",
    "payload": { "taskId": "uuid", "orgId": "...", "content": "...", "agentId": "..." },
    "riskLevel": "low",
    "confidence": 0.88
  }
]
\`\`\`

Sentiment categories: positive, neutral, negative, urgent
Escalation threshold: confidence >= 0.75 for urgent sentiment

Rules:
- Never create customer-facing messages without human approval (always pending)
- Prefer adding internal notes (post_comment) over direct escalations
- Flag tasks needing manager attention via send_notification`;

  protected tools = [
    tool(
      async ({ text }) => {
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            {
              role: "system",
              content:
                'Analyze the sentiment of this text. Respond with JSON: { "sentiment": "positive|neutral|negative|urgent", "score": 0-1, "keywords": [] }',
            },
            { role: "user", content: text },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        });
        return response.choices[0]?.message?.content ?? "{}";
      },
      {
        name: "analyze_sentiment",
        description: "Analyze the sentiment of a piece of text",
        schema: z.object({ text: z.string() }),
      },
    ),

    tool(
      async ({ orgId }) => {
        const recentComments = await prisma.taskComment.findMany({
          where: { orgId, createdAt: { gte: new Date(Date.now() - 86400000) } },
          include: { task: { include: { project: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        return JSON.stringify(
          recentComments.map((c) => ({
            id: c.id,
            content: c.content,
            taskTitle: c.task.title,
            project: c.task.project?.name,
            createdAt: c.createdAt,
          })),
        );
      },
      {
        name: "get_recent_comments",
        description: "Get recent task comments from the last 24 hours",
        schema: z.object({ orgId: z.string() }),
      },
    ),

    tool(
      async ({ orgId }) => {
        const customerTasks = await prisma.task.findMany({
          where: {
            orgId,
            OR: [
              { title: { contains: "customer", mode: "insensitive" } },
              { title: { contains: "client", mode: "insensitive" } },
              { title: { contains: "support", mode: "insensitive" } },
            ],
            status: { in: [TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS] },
            deletedAt: null,
          },
          include: { assignee: true },
          take: 10,
        });
        return JSON.stringify(customerTasks);
      },
      {
        name: "get_customer_tasks",
        description: "Get active customer-related tasks that may need attention",
        schema: z.object({ orgId: z.string() }),
      },
    ),
  ];
}
