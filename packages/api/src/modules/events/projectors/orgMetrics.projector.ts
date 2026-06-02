import { prisma } from "../../../config/prisma.js";
import type { OutboxEventEnvelope } from "../events.service.js";

/**
 * Projector: keep OrgMetricsReadModel in sync with task + agent events.
 *
 * Rather than maintaining deltas we recompute from the source tables on
 * each event. This is O(constant) for an org (small enough to fit in
 * one query) and is robust against projector drift — the read model
 * always matches the latest ground truth after each event.
 */
const relevantTypes = [
  "task.created",
  "task.status_changed",
  "task.deleted",
  "agent.action.created",
  "agent.action.executed",
  "agent.action.approved",
  "agent.action.rejected",
];

export async function orgMetricsProjector(event: OutboxEventEnvelope): Promise<void> {
  if (!relevantTypes.includes(event.type)) return;
  await recomputeOrgMetrics(event.orgId);
}

async function recomputeOrgMetrics(orgId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeTasks, completedTasksToday, pendingApprovals, agentActionsToday] =
    await Promise.all([
      prisma.task.count({
        where: { orgId, status: { not: "DONE" } },
      }),
      prisma.event.count({
        where: {
          orgId,
          type: "task.status_changed",
          occurredAt: { gte: today },
          payload: { path: ["to"], equals: "done" },
        },
      }),
      prisma.agentAction.count({
        where: { orgId, status: "PENDING" },
      }),
      prisma.agentAction.count({
        where: {
          orgId,
          status: "EXECUTED",
          createdAt: { gte: today },
        },
      }),
    ]);

  // Org-wide health = mean of project health scores (default 100 if no
  // projects yet).
  const projects = await prisma.projectReadModel.findMany({
    where: { orgId },
    select: { healthScore: true },
  });
  const healthScore =
    projects.length > 0
      ? Math.round(
          projects.reduce(
            (sum: number, p: { healthScore: number }) => sum + p.healthScore,
            0,
          ) / projects.length,
        )
      : 100;

  await prisma.orgMetricsReadModel.upsert({
    where: { id: orgId },
    create: {
      id: orgId,
      activeTasks,
      completedTasksToday,
      pendingApprovals,
      agentActionsToday,
      healthScore,
    },
    update: {
      activeTasks,
      completedTasksToday,
      pendingApprovals,
      agentActionsToday,
      healthScore,
    },
  });
}
