import type { Project, ProjectStatus, Priority, User } from "@prisma/client";

/**
 * Project response DTO (PRD §4.1).
 *
 * Includes the parent workspace summary and the live counters
 * (`taskCount`, `completedTaskCount`, `memberCount`, `healthScore`).
 */
export interface ProjectResponse {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: Priority;
  dueDate: string | null;
  metadata: Record<string, unknown>;
  orgId: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  taskCount: number;
  completedTaskCount: number;
  memberCount: number;
  healthScore: number;
  workspace: { id: string; name: string };
}

/**
 * Project member DTO (PRD §4.2).
 */
export interface ProjectMemberResponse {
  id: string;          // ProjectMember.id
  userId: string;
  name: string;
  email: string;
  role: string;        // ProjectMember.role
  avatarUrl: string | null;
  joinedAt: string;
}

/**
 * Project statistics (PRD §4.5).
 */
export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTaskCount: number;
  completionRate: number;
  healthScore: number;
  memberCount: number;
  daysUntilDue: number | null;
}

export interface ProjectListStats {
  taskCount: number;
  completedTaskCount: number;
}

/**
 * Map a Project row (plus its optional workspace summary and stats) to
 * the public DTO.
 */
export function toProjectResponse(
  row: Project & {
    workspace?: { id: string; name: string } | null;
  },
  stats?: ProjectListStats,
  memberCount: number = 0,
  healthScore: number = 100,
): ProjectResponse {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    orgId: row.orgId,
    workspaceId: row.workspaceId,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    taskCount: stats?.taskCount ?? 0,
    completedTaskCount: stats?.completedTaskCount ?? 0,
    memberCount,
    healthScore,
    workspace: row.workspace
      ? { id: row.workspace.id, name: row.workspace.name }
      : { id: row.workspaceId, name: "" },
  };
}

/**
 * Map a ProjectMember + User join to the public member DTO.
 */
export function toProjectMemberResponse(
  pm: { id: string; role: string; joinedAt: Date; user: User },
): ProjectMemberResponse {
  return {
    id: pm.id,
    userId: pm.user.id,
    name: pm.user.name,
    email: pm.user.email,
    role: pm.role,
    avatarUrl: pm.user.avatarUrl,
    joinedAt: pm.joinedAt.toISOString(),
  };
}
