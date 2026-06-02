import type { Workspace, User } from "@prisma/client";

/**
 * Workspace response DTO (PRD §3.1).
 *
 * Counters are computed at read time and never persisted on the row.
 */
export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string | null;
  orgId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  projectCount: number;
  memberCount: number;
}

/**
 * Workspace member response (PRD §3.2).
 *
 * Phase 5: a "workspace member" is any user in the same org, because the
 * schema doesn't have a dedicated workspace membership table. The TODO
 * in the service notes the future `workspace_members` table.
 */
export interface WorkspaceMemberResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  joinedAt: string;
}

/**
 * Map a Workspace row (optionally with counts) to the public response.
 */
export function toWorkspaceResponse(
  row: Workspace & {
    _count?: { projects?: number };
    memberCount?: number;
  },
): WorkspaceResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    orgId: row.orgId,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    // Workspace has no `updatedAt` column — return null for forward compat.
    updatedAt: null,
    projectCount: row._count?.projects ?? 0,
    memberCount: row.memberCount ?? 0,
  };
}

/**
 * Map a User row to the public member response.
 */
export function toWorkspaceMemberResponse(
  user: Pick<User, "id" | "name" | "email" | "role" | "avatarUrl" | "createdAt">,
): WorkspaceMemberResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    // Workspace membership join date is not tracked in Phase 5; use createdAt.
    joinedAt: user.createdAt.toISOString(),
  };
}
