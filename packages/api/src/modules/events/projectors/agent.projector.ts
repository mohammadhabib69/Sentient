import { prisma } from "../../../config/prisma.js";
import type { OutboxEventEnvelope } from "../events.service.js";

/**
 * Projector: keep AgentReadModel in sync with agent action events.
 *
 *   agent.action.created   → +1 pendingApprovals
 *   agent.action.approved  → −1 pendingApprovals
 *   agent.action.rejected  → −1 pendingApprovals
 *   agent.action.executed  → +1 actionsToday, actionsThisWeek, totalActionsAllTime
 */
const agentEvents = [
  "agent.action.created",
  "agent.action.approved",
  "agent.action.rejected",
  "agent.action.executed",
  "agent.action.failed",
];

export async function agentProjector(event: OutboxEventEnvelope): Promise<void> {
  if (!agentEvents.includes(event.type)) return;

  const payload = event.payload as Record<string, unknown>;
  const agentId = (payload.agentId as string) ?? event.aggregateId;
  if (!agentId) return;

  if (event.type === "agent.action.created") {
    await prisma.agentReadModel.upsert({
      where: { id: agentId },
      create: {
        id: agentId,
        orgId: event.orgId,
        name: (payload.agentName as string) ?? "Agent",
        type: (payload.agentType as string) ?? "custom",
        isActive: true,
        pendingApprovals: 1,
        lastActionAt: new Date(event.occurredAt),
        lastEventVersion: event.version,
      },
      update: {
        pendingApprovals: { increment: 1 },
        lastActionAt: new Date(event.occurredAt),
        lastEventVersion: event.version,
      },
    });
    return;
  }

  if (event.type === "agent.action.approved" || event.type === "agent.action.rejected") {
    await prisma.agentReadModel
      .updateMany({
        where: { id: agentId },
        data: { pendingApprovals: { decrement: 1 } },
      })
      .catch(() => undefined);
    return;
  }

  if (event.type === "agent.action.executed" || event.type === "agent.action.failed") {
    await prisma.agentReadModel
      .updateMany({
        where: { id: agentId },
        data: {
          totalActionsAllTime: { increment: 1 },
          actionsToday: { increment: 1 },
          actionsThisWeek: { increment: 1 },
          lastActionAt: new Date(event.occurredAt),
        },
      })
      .catch(() => undefined);
  }
}
