import { prisma } from "../../../config/prisma.js";
import type { OutboxEventEnvelope } from "../events.service.js";

/**
 * Projector: keep ProjectReadModel in sync with task + project events.
 *
 * The read model is the source of truth for dashboard health. The
 * projector treats it as a derived view: events flow in, counts are
 * incremented / decremented, and a simple `healthScore` is recalculated
 * after every change.
 */
const projectEvents = [
  "project.created",
  "project.updated",
  "project.deleted",
  "task.created",
  "task.deleted",
  "task.status_changed",
];

export async function projectProjector(event: OutboxEventEnvelope): Promise<void> {
  if (!projectEvents.includes(event.type)) return;

  const payload = event.payload as Record<string, unknown>;

  if (event.type === "project.created") {
    await prisma.projectReadModel.upsert({
      where: { id: event.aggregateId },
      create: {
        id: event.aggregateId,
        orgId: (payload.orgId as string) ?? event.orgId,
        name: (payload.name as string) ?? "Untitled",
        status: "active",
        lastActivityAt: new Date(event.occurredAt),
        lastEventVersion: event.version,
      },
      update: {
        name: (payload.name as string) ?? undefined,
        lastActivityAt: new Date(event.occurredAt),
        lastEventVersion: event.version,
      },
    });
    return;
  }

  if (event.type === "project.updated") {
    const changes = (payload.changes as Record<string, { to: unknown }>) ?? {};
    if (changes.name) {
      await prisma.projectReadModel.update({
        where: { id: event.aggregateId },
        data: {
          name: changes.name.to as string,
          lastActivityAt: new Date(event.occurredAt),
          lastEventVersion: event.version,
        },
      });
    }
    return;
  }

  if (event.type === "project.deleted") {
    await prisma.projectReadModel
      .delete({ where: { id: event.aggregateId } })
      .catch(() => undefined);
    return;
  }

  if (event.type === "task.created") {
    const projectId = payload.projectId as string | undefined;
    if (!projectId) return;
    await prisma.projectReadModel
      .update({
        where: { id: projectId },
        data: {
          totalTasks: { increment: 1 },
          lastActivityAt: new Date(event.occurredAt),
          lastEventVersion: { set: Math.max(event.version, 0) },
        },
      })
      .catch(() => undefined);
    await recalculateHealthScore(projectId);
    return;
  }

  if (event.type === "task.deleted") {
    const task = await prisma.task.findFirst({
      where: { id: event.aggregateId },
      select: { projectId: true },
    });
    if (!task) return;
    await prisma.projectReadModel
      .update({
        where: { id: task.projectId },
        data: {
          totalTasks: { decrement: 1 },
          lastActivityAt: new Date(event.occurredAt),
        },
      })
      .catch(() => undefined);
    await recalculateHealthScore(task.projectId);
    return;
  }

  if (event.type === "task.status_changed") {
    const task = await prisma.task.findFirst({
      where: { id: event.aggregateId },
      select: { projectId: true },
    });
    if (!task) return;

    const updates: Record<string, unknown> = {
      lastActivityAt: new Date(event.occurredAt),
    };

    const from = readStatus(payload.changes, "from", "status");
    const to = readStatus(payload.changes, "to", "status");
    const fromBare = (payload.from as string | undefined) ?? from;
    const toBare = (payload.to as string | undefined) ?? to;

    if (fromBare === "in_progress") updates.inProgressTasks = { decrement: 1 };
    if (fromBare === "blocked") updates.blockedTasks = { decrement: 1 };
    if (toBare === "in_progress") updates.inProgressTasks = { increment: 1 };
    if (toBare === "blocked") updates.blockedTasks = { increment: 1 };
    if (toBare === "done") updates.completedTasks = { increment: 1 };
    if (fromBare === "done") updates.completedTasks = { decrement: 1 };

    await prisma.projectReadModel
      .update({
        where: { id: task.projectId },
        data: updates,
      })
      .catch(() => undefined);
    await recalculateHealthScore(task.projectId);
  }
}

function readStatus(
  changes: unknown,
  side: "from" | "to",
  field: string,
): string | undefined {
  if (!changes || typeof changes !== "object") return undefined;
  const obj = changes as Record<string, Record<string, unknown>>;
  return obj[field]?.[side] as string | undefined;
}

/**
 * Recompute the project's health score from current counts.
 *
 *   start at 100
 *   −5 for each blocked task
 *   −3 for each overdue task
 *   floor at 0
 *
 * Overdue requires reading task.dueDate — we approximate by counting
 * tasks with `dueDate < now() AND status NOT IN (done)`. This is best-
 * effort; a follow-up could materialize this as a separate view.
 */
async function recalculateHealthScore(projectId: string): Promise<void> {
  const model = await prisma.projectReadModel.findFirst({
    where: { id: projectId },
  });
  if (!model) return;

  const now = new Date();
  const overdueTaskCount = await prisma.task.count({
    where: {
      projectId,
      status: { not: "DONE" },
      dueDate: { lt: now },
    },
  });

  let score = 100;
  score -= model.blockedTasks * 5;
  score -= overdueTaskCount * 3;
  score = Math.max(0, score);

  await prisma.projectReadModel.update({
    where: { id: projectId },
    data: { healthScore: score, overdueTaskCount },
  });
}
