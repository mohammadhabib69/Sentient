/**
 * Action executor dispatcher (Phase 8 §5.2).
 *
 * Maps `action.actionType` → concrete side-effect handler. Every
 * executor MUST scope to `req.orgId` (the action's `orgId`) and verify
 * the target entity belongs to that org before mutating it. Errors
 * bubble up so the HITL service can mark the action `failed`.
 */
import { TaskStatus, Priority, ActorType } from "@prisma/client";
import type { AgentAction, Agent } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { eventsService } from "../events/events.service.js";
import { emitToUser } from "../../websocket/events.js";
import { AppError } from "../../utils/errors.js";

type ActionWithAgent = AgentAction & { agent: Agent };

/** Dispatch an approved action to the right executor. */
export async function dispatchActionExecution(
  action: ActionWithAgent,
): Promise<Record<string, unknown>> {
  const payload = (action.payload ?? {}) as Record<string, unknown>;

  switch (action.actionType) {
    case "reassign_task":
      return executeReassignTask(payload);
    case "update_task_priority":
      return executeUpdateTaskPriority(payload);
    case "update_task_due_date":
      return executeUpdateTaskDueDate(payload);
    case "create_task":
      return executeCreateTask(payload);
    case "send_notification":
      return executeSendNotification(payload);
    case "flag_overdue_project":
      return executeFlagOverdueProject(payload);
    case "update_task_status":
      return executeUpdateTaskStatus(payload);
    case "post_comment":
      return executePostComment(payload);
    default:
      throw new AppError(
        `Unknown action type: ${action.actionType}`,
        400,
        "UNKNOWN_ACTION_TYPE" as any,
      );
  }
}

async function ensureOrgMatch(
  entityOrgId: string,
  expectedOrgId: string,
  entityName: string,
): Promise<void> {
  if (entityOrgId !== expectedOrgId) {
    throw new AppError(
      `${entityName} does not belong to this organization`,
      403,
      "CROSS_ORG_FORBIDDEN" as any,
    );
  }
}

async function executeReassignTask(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const taskId = payload.taskId as string;
  const newAssigneeId = payload.newAssigneeId as string;
  const newAssigneeName = payload.newAssigneeName as string | undefined;
  const reason = payload.reason as string | undefined;
  const orgId = payload.orgId as string;
  const agentId = payload.agentId as string | undefined;

  if (!taskId || !newAssigneeId || !orgId) {
    throw new AppError(
      "reassign_task requires taskId, newAssigneeId, and orgId",
      400,
      "INVALID_PAYLOAD" as any,
    );
  }

  const task = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
  if (!task) throw new AppError("Task not found", 404, "NOT_FOUND" as any);
  await ensureOrgMatch(task.orgId, orgId, "Task");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId: newAssigneeId },
  });

  await eventsService.logEvent({
    orgId,
    type: "task.assigned",
    aggregateId: updated.id,
    aggregateType: "task",
    payload: {
      taskTitle: updated.title,
      assigneeId: newAssigneeId,
      assigneeName: newAssigneeName,
      reason,
    },
    actorId: agentId ?? "00000000-0000-0000-0000-000000000000",
    actorType: ActorType.AGENT,
  });

  return { taskId: updated.id, newAssigneeId };
}

async function executeUpdateTaskPriority(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const taskId = payload.taskId as string;
  const priority = payload.priority as string;
  const orgId = payload.orgId as string;
  if (!taskId || !priority || !orgId) {
    throw new AppError(
      "update_task_priority requires taskId, priority, orgId",
      400,
      "INVALID_PAYLOAD" as any,
    );
  }
  const existing = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
  if (!existing) throw new AppError("Task not found", 404, "NOT_FOUND" as any);
  await ensureOrgMatch(existing.orgId, orgId, "Task");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { priority: priority as any },
  });
  return { taskId: task.id, priority: task.priority };
}

async function executeUpdateTaskDueDate(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const taskId = payload.taskId as string;
  const dueDate = payload.dueDate as string;
  const orgId = payload.orgId as string;
  if (!taskId || !dueDate || !orgId) {
    throw new AppError(
      "update_task_due_date requires taskId, dueDate, orgId",
      400,
      "INVALID_PAYLOAD" as any,
    );
  }
  const existing = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
  if (!existing) throw new AppError("Task not found", 404, "NOT_FOUND" as any);
  await ensureOrgMatch(existing.orgId, orgId, "Task");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { dueDate: new Date(dueDate) },
  });
  return { taskId: task.id, dueDate: task.dueDate };
}

async function executeCreateTask(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const projectId = payload.projectId as string;
  const orgId = payload.orgId as string;
  const title = payload.title as string;
  const description = (payload.description as string | undefined) ?? null;
  const priority = (payload.priority as string | undefined) ?? Priority.MEDIUM;
  const assigneeId = (payload.assigneeId as string | undefined) ?? null;
  const agentId = (payload.agentId as string | undefined) ?? null;

  if (!projectId || !orgId || !title) {
    throw new AppError(
      "create_task requires projectId, orgId, title",
      400,
      "INVALID_PAYLOAD" as any,
    );
  }

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404, "NOT_FOUND" as any);
  await ensureOrgMatch(project.orgId, orgId, "Project");

  const task = await prisma.task.create({
    data: {
      projectId,
      orgId,
      title,
      description,
      status: TaskStatus.TODO,
      priority: priority as any,
      assigneeId,
      graphNodeId: (payload.graphNodeId as string | undefined) ?? `agent-task-${Date.now()}`,
      createdBy: agentId ?? "00000000-0000-0000-0000-000000000000",
      position: 0,
    },
  });
  return { taskId: task.id };
}

async function executeSendNotification(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const userId = payload.userId as string;
  const orgId = payload.orgId as string;
  const title = payload.title as string;
  const body = (payload.body as string | undefined) ?? "";
  const type = (payload.type as string | undefined) ?? "agent_alert";
  if (!userId || !orgId || !title) {
    throw new AppError(
      "send_notification requires userId, orgId, title",
      400,
      "INVALID_PAYLOAD" as any,
    );
  }
  const notification = await prisma.notification.create({
    data: {
      userId,
      orgId,
      type,
      title,
      body,
      data: ((payload.data as Record<string, unknown>) ?? {}) as any,
    },
  });
  emitToUser(userId, "notification:new", { notification });
  return { notificationId: notification.id };
}

async function executeFlagOverdueProject(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const projectId = payload.projectId as string;
  const orgId = payload.orgId as string;
  const newStatus = (payload.newStatus as string | undefined) ?? "active";
  if (!projectId || !orgId) {
    throw new AppError(
      "flag_overdue_project requires projectId, orgId",
      400,
      "INVALID_PAYLOAD" as any,
    );
  }
  const existing = await prisma.project.findFirst({ where: { id: projectId } });
  if (!existing) throw new AppError("Project not found", 404, "NOT_FOUND" as any);
  await ensureOrgMatch(existing.orgId, orgId, "Project");

  await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus as any },
  });
  return { projectId };
}

async function executeUpdateTaskStatus(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const taskId = payload.taskId as string;
  const status = payload.status as string;
  const orgId = payload.orgId as string;
  if (!taskId || !status || !orgId) {
    throw new AppError(
      "update_task_status requires taskId, status, orgId",
      400,
      "INVALID_PAYLOAD" as any,
    );
  }
  const existing = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
  if (!existing) throw new AppError("Task not found", 404, "NOT_FOUND" as any);
  await ensureOrgMatch(existing.orgId, orgId, "Task");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: status as any },
  });
  return { taskId: task.id, status: task.status };
}

async function executePostComment(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const taskId = payload.taskId as string;
  const orgId = payload.orgId as string;
  const content = payload.content as string;
  const agentId = (payload.agentId as string | undefined) ?? "00000000-0000-0000-0000-000000000000";
  if (!taskId || !orgId || !content) {
    throw new AppError(
      "post_comment requires taskId, orgId, content",
      400,
      "INVALID_PAYLOAD" as any,
    );
  }
  const task = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
  if (!task) throw new AppError("Task not found", 404, "NOT_FOUND" as any);
  await ensureOrgMatch(task.orgId, orgId, "Task");

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      orgId,
      authorId: agentId,
      content,
    },
  });
  return { commentId: comment.id };
}
