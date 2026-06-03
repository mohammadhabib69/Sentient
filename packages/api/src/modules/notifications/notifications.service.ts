/**
 * Phase 10 — Notification service.
 *
 * Creates notifications, emits via Socket.io, and enqueues emails.
 */
import { prisma } from "../../config/prisma.js";
import { emailQueue } from "../../config/queues.js";
import { emitToUser } from "../../websocket/events.js";
import { notificationEmailTemplate } from "./email.service.js";

export interface CreateNotificationParams {
  userId: string;
  orgId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sendEmail?: boolean;
}

export async function createNotification(
  params: CreateNotificationParams,
) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      orgId: params.orgId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: (params.data ?? {}) as any,
    },
  });

  // Fetch user for email
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  });

  // Emit via Socket.io
  emitToUser(params.userId, "notification:new", { notification });

  // Enqueue email if enabled
  if (params.sendEmail !== false && user?.email && user.emailVerified) {
    await emailQueue.add("send-email", {
      to: user.email,
      subject: params.title,
      html: notificationEmailTemplate({
        userName: user.name,
        title: params.title,
        body: params.body,
      }),
      orgId: params.orgId,
      notificationId: notification.id,
    }, {
      priority: 5,
      attempts: 5,
    });
  }

  return notification;
}
