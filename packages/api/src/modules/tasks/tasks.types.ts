import type { Task, TaskStatus, Priority, User } from "@prisma/client";

/**
 * Task response DTO (PRD §5.3).
 */
export interface TaskResponse {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  position: number;
  assigneeId: string | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  dueDate: string | null;
  estimatedHours: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  subtaskCount: number;
  completedSubtaskCount: number;
}

/**
 * Task comment DTO (PRD §5.7).
 */
export interface TaskCommentResponse {
  id: string;
  taskId: string;
  content: string;
  author: { id: string; name: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
}

/**
 * Map a Task row (+ optional assignee) to the public DTO. Subtask counts
 * are passed in by the caller (we compute them at list time, not on
 * every row).
 */
export function toTaskResponse(
  row: Task & {
    assignee?: { id: string; name: string; avatarUrl: string | null } | null;
  },
  subtaskCount: number = 0,
  completedSubtaskCount: number = 0,
): TaskResponse {
  return {
    id: row.id,
    projectId: row.projectId,
    parentTaskId: row.parentTaskId,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    position: row.position,
    assigneeId: row.assigneeId,
    assignee: row.assignee
      ? { id: row.assignee.id, name: row.assignee.name, avatarUrl: row.assignee.avatarUrl }
      : null,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    estimatedHours: row.estimatedHours ? Number(row.estimatedHours) : null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    subtaskCount,
    completedSubtaskCount,
  };
}

/**
 * Map a TaskComment row (+ author) to the public DTO.
 */
export function toTaskCommentResponse(
  row: {
    id: string;
    taskId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: User;
  },
): TaskCommentResponse {
  return {
    id: row.id,
    taskId: row.taskId,
    content: row.content,
    author: {
      id: row.author.id,
      name: row.author.name,
      avatarUrl: row.author.avatarUrl,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
