import { prisma } from "../../../config/prisma.js";
import type { OutboxEventEnvelope } from "../events.service.js";

/**
 * Projector: keep UserActivityReadModel in sync with user-attributed
 * events. The model powers the team analytics view.
 */
const userActivityTypes = ["task.created", "task.status_changed", "task.comment_added"];

export async function userActivityProjector(
  event: OutboxEventEnvelope,
): Promise<void> {
  if (!userActivityTypes.includes(event.type)) return;
  if (event.actorType !== "USER") return;

  await prisma.userActivityReadModel
    .upsert({
      where: { id: event.actorId },
      create: {
        id: event.actorId,
        orgId: event.orgId,
        name: "Member",
        lastActiveAt: new Date(event.occurredAt),
        lastEventVersion: event.version,
      },
      update: {
        lastActiveAt: new Date(event.occurredAt),
        lastEventVersion: event.version,
      },
    })
    .catch(() => undefined);

  if (event.type === "task.created") {
    await prisma.userActivityReadModel
      .update({
        where: { id: event.actorId },
        data: { tasksCreatedToday: { increment: 1 } },
      })
      .catch(() => undefined);
    return;
  }

  if (event.type === "task.status_changed") {
    const payload = event.payload as Record<string, unknown>;
    const to = (payload.to as string) ?? readSide(payload, "to", "status");
    if (to === "done") {
      await prisma.userActivityReadModel
        .update({
          where: { id: event.actorId },
          data: {
            tasksCompletedToday: { increment: 1 },
            tasksCompletedWeek: { increment: 1 },
          },
        })
        .catch(() => undefined);
    }
    return;
  }

  if (event.type === "task.comment_added") {
    await prisma.userActivityReadModel
      .update({
        where: { id: event.actorId },
        data: { commentsToday: { increment: 1 } },
      })
      .catch(() => undefined);
  }
}

function readSide(
  payload: unknown,
  side: "from" | "to",
  field: string,
): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, Record<string, unknown>>;
  return obj[field]?.[side] as string | undefined;
}
