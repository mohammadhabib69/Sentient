import { prisma } from "../../../config/prisma.js";
import { emitToUser } from "../../../websocket/events.js";
import type { OutboxEventEnvelope } from "../events.service.js";

/**
 * Projector: turn events into notifications.
 *
 * Phase 5 had services calling `notificationsService.create()` directly.
 * Phase 7 removes those calls — services only log events; this
 * projector decides who to notify, what to say, and pushes the result
 * to the user's `notification:new` socket.
 *
 * Add new rules by extending the `rules` map below.
 */

type NotificationRule = (event: OutboxEventEnvelope) => Promise<void>;

const rules: Record<string, NotificationRule> = {
  "task.assigned": async (event) => {
    const payload = event.payload as Record<string, unknown>;
    const changes = (payload.changes as Record<string, { from: unknown; to: unknown }>) ?? {};
    const assigneeId =
      (changes.assigneeId?.to as string | null) ?? (payload.assigneeId as string | undefined);
    if (!assigneeId) return;
    if (assigneeId === event.actorId) return; // no self-notify

    const task = await prisma.task.findFirst({
      where: { id: event.aggregateId },
      select: { title: true },
    });
    await createNotification({
      userId: assigneeId,
      orgId: event.orgId,
      type: "task_assigned",
      title: "Task assigned to you",
      body: `You were assigned: "${task?.title ?? "a task"}"`,
      data: { taskId: event.aggregateId },
    });
  },

  "task.comment_added": async (event) => {
    const payload = event.payload as Record<string, unknown>;
    const task = await prisma.task.findFirst({
      where: { id: event.aggregateId },
      select: { assigneeId: true },
    });
    if (!task?.assigneeId || task.assigneeId === event.actorId) return;
    await createNotification({
      userId: task.assigneeId,
      orgId: event.orgId,
      type: "task_comment",
      title: "New comment on your task",
      body: (payload.contentPreview as string | undefined) ?? "New comment",
      data: { taskId: event.aggregateId },
    });
  },

  "agent.action.created": async (event) => {
    const payload = event.payload as Record<string, unknown>;
    const admins = await prisma.user.findMany({
      where: {
        orgId: event.orgId,
        role: { in: ["SUPER_ADMIN", "ORG_ADMIN", "MANAGER"] },
      },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          orgId: event.orgId,
          type: "agent_approval_needed",
          title: `${(payload.agentName as string | undefined) ?? "Agent"} needs approval`,
          body:
            (payload.description as string | undefined) ??
            "An agent is requesting approval for an action.",
          data: { actionId: event.aggregateId },
        }),
      ),
    );
  },
};

export async function notificationProjector(
  event: OutboxEventEnvelope,
): Promise<void> {
  const handler = rules[event.type];
  if (!handler) return;
  try {
    await handler(event);
  } catch (err) {
    // Notifications are best-effort — never fail the outbox delivery.
    console.error(
      `[events.notificationProjector] failed for type=${event.type}`,
      err,
    );
  }
}

async function createNotification(args: {
  userId: string;
  orgId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
}): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId: args.userId,
      orgId: args.orgId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data as any,
    },
  });
  emitToUser(args.userId, "notification:new", { notification });
}
