import { ActorType, type Workspace, type User } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { eventsService, EventType } from "../events/events.service.js";
import { enqueueGraphSync } from "../graph/graphSync.helper.js";
import { emitToOrg } from "../../websocket/events.js";
import { paginateCursor } from "../../utils/pagination.js";
import { AppError, NotFoundError, ConflictError } from "../../utils/errors.js";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  ListWorkspacesQuery,
  AddMemberInput,
} from "./workspaces.schema.js";
import { toWorkspaceResponse } from "./workspaces.types.js";

/**
 * Workspaces service (PRD §3).
 *
 * Multi-tenancy: every query is scoped by `orgId` (the caller's org from the
 * JWT). The schema model has a composite index on `orgId, deletedAt` for
 * efficient active-workspace lookups.
 *
 * Cross-cutting effects (PRD §7, §9):
 *  - Every mutating action calls `eventsService.logEvent(...)`.
 *  - Every mutating action enqueues a `graphSyncQueue` job via
 *    `enqueueGraphSync(...)`.
 *  - Every mutating action calls `emitToOrg(...)` for the WS broadcast stub.
 *
 * TODO: when the schema gains a dedicated `workspace_members` table, replace
 * the "members = org users" listing with a `workspaceMember.findMany` query,
 * and `addMember` / `removeMember` will do real DB writes.
 */
export class WorkspacesService {
  /**
   * GET /v1/workspaces — cursor-paginated list of active workspaces.
   * Supports an optional case-insensitive name search.
   */
  async listWorkspaces(
    orgId: string,
    query: ListWorkspacesQuery,
  ): Promise<{
    items: ReturnType<typeof toWorkspaceResponse>[];
    meta: { nextCursor: string | null; total: number; hasMore: boolean };
  }> {
    const where: Record<string, unknown> = { orgId, deletedAt: null };
    if (query.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }

    const { items, meta } = await paginateCursor<Workspace>({
      model: prisma.workspace as any,
      where,
      limit: query.limit,
      cursor: query.cursor,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { _count: { select: { projects: true } } },
    });

    // memberCount is a per-org count — same for every workspace in this org.
    const memberCount = await prisma.user.count({ where: { orgId } });
    const itemsWithCounts = items.map((ws) =>
      toWorkspaceResponse({ ...ws, memberCount }),
    );

    return { items: itemsWithCounts, meta };
  }

  /**
   * POST /v1/workspaces — create a new workspace in the caller's org.
   */
  async createWorkspace(
    orgId: string,
    actorId: string,
    input: CreateWorkspaceInput,
  ): Promise<ReturnType<typeof toWorkspaceResponse>> {
    const created = await prisma.workspace.create({
      data: {
        orgId,
        name: input.name,
        description: input.description ?? null,
        createdBy: actorId,
        // Placeholder — the graph sync worker fills this in once it has a Neo4j nodeId.
        graphNodeId: "",
      },
    });

    // Cross-cutting effects. Failures here shouldn't roll back the create —
    // the queue and WS stub are best-effort.
    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.WORKSPACE_CREATED,
        aggregateId: created.id,
        aggregateType: "workspace",
        payload: { name: created.name, description: created.description },
        actorId,
        actorType: ActorType.USER,
      }),
      enqueueGraphSync({ action: "CREATE_WORKSPACE", workspaceId: created.id }),
    ]);
    emitToOrg(orgId, "workspace.created", { id: created.id, name: created.name });

    return toWorkspaceResponse(created);
  }

  /**
   * GET /v1/workspaces/:id — fetch a single active workspace.
   */
  async getWorkspace(
    orgId: string,
    id: string,
  ): Promise<ReturnType<typeof toWorkspaceResponse>> {
    const ws = await prisma.workspace.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { _count: { select: { projects: true } } },
    });
    if (!ws) throw new NotFoundError("Workspace");

    const memberCount = await prisma.user.count({ where: { orgId } });
    return toWorkspaceResponse({ ...ws, memberCount });
  }

  /**
   * PATCH /v1/workspaces/:id — partial update with a `changes` diff for the event.
   */
  async updateWorkspace(
    orgId: string,
    actorId: string,
    id: string,
    input: UpdateWorkspaceInput,
  ): Promise<ReturnType<typeof toWorkspaceResponse>> {
    const existing = await prisma.workspace.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Workspace");

    // Build the changes diff (only the fields the caller actually sent).
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const data: Record<string, unknown> = {};
    if (input.name !== undefined && input.name !== existing.name) {
      changes.name = { from: existing.name, to: input.name };
      data.name = input.name;
    }
    if (input.description !== undefined && input.description !== existing.description) {
      changes.description = { from: existing.description, to: input.description };
      data.description = input.description;
    }

    if (Object.keys(changes).length === 0) {
      // Nothing to update — return as-is (no event, no graph sync).
      const memberCount = await prisma.user.count({ where: { orgId } });
      const fresh = await prisma.workspace.findUnique({
        where: { id },
        include: { _count: { select: { projects: true } } },
      });
      return toWorkspaceResponse({ ...fresh!, memberCount });
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data,
    });

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.WORKSPACE_UPDATED,
        aggregateId: id,
        aggregateType: "workspace",
        payload: { changes },
        actorId,
        actorType: ActorType.USER,
      }),
      enqueueGraphSync({ action: "UPDATE_WORKSPACE", workspaceId: id }),
    ]);
    emitToOrg(orgId, "workspace.updated", { id, changes });

    const memberCount = await prisma.user.count({ where: { orgId } });
    return toWorkspaceResponse({
      ...updated,
      _count: { projects: 0 },
      memberCount,
    });
  }

  /**
   * DELETE /v1/workspaces/:id — soft delete.
   * Rejects with 409 if any active (non-archived) project still lives inside.
   */
  async softDeleteWorkspace(
    orgId: string,
    actorId: string,
    id: string,
  ): Promise<{ id: string; deleted: true }> {
    const existing = await prisma.workspace.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Workspace");

    const activeProjectCount = await prisma.project.count({
      where: {
        workspaceId: id,
        orgId,
        deletedAt: null,
        status: { not: "ARCHIVED" },
      },
    });
    if (activeProjectCount > 0) {
      throw new AppError(
        "Cannot delete workspace with active projects",
        409,
        "WORKSPACE_HAS_PROJECTS",
        { activeProjectCount },
      );
    }

    await prisma.workspace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.WORKSPACE_DELETED,
        aggregateId: id,
        aggregateType: "workspace",
        payload: { name: existing.name },
        actorId,
        actorType: ActorType.USER,
      }),
      enqueueGraphSync({ action: "DELETE_WORKSPACE", workspaceId: id }),
    ]);
    emitToOrg(orgId, "workspace.deleted", { id });

    return { id, deleted: true };
  }

  /**
   * GET /v1/workspaces/:id/members — list all org users (Phase 5 placeholder).
   * TODO: replace with `workspaceMember.findMany` when the table exists.
   */
  async listMembers(orgId: string, workspaceId: string): Promise<User[]> {
    const ws = await prisma.workspace.findFirst({
      where: { id: workspaceId, orgId, deletedAt: null },
      select: { id: true },
    });
    if (!ws) throw new NotFoundError("Workspace");
    return prisma.user.findMany({
      where: { orgId },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  }

  /**
   * POST /v1/workspaces/:id/members — record membership intent.
   * Phase 5: no DB write (members == org users). Still emits the event.
   */
  async addMember(
    orgId: string,
    actorId: string,
    workspaceId: string,
    input: AddMemberInput,
  ): Promise<{ userId: string; role: string; added: true }> {
    const ws = await prisma.workspace.findFirst({
      where: { id: workspaceId, orgId, deletedAt: null },
    });
    if (!ws) throw new NotFoundError("Workspace");

    const user = await prisma.user.findFirst({
      where: { id: input.userId, orgId },
    });
    if (!user) {
      // Same shape as NotFoundError so callers can rely on the 404 + NOT_FOUND code.
      throw new NotFoundError("User");
    }

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.MEMBER_ADDED,
        aggregateId: workspaceId,
        aggregateType: "workspace",
        payload: { userId: input.userId, role: input.role },
        actorId,
        actorType: ActorType.USER,
      }),
      enqueueGraphSync({
        action: "ADD_MEMBER",
        workspaceId,
        userId: input.userId,
      }),
    ]);
    emitToOrg(orgId, "member.added", { workspaceId, userId: input.userId, role: input.role });

    return { userId: input.userId, role: input.role, added: true };
  }

  /**
   * DELETE /v1/workspaces/:id/members/:userId — no DB write in Phase 5.
   */
  async removeMember(
    orgId: string,
    actorId: string,
    workspaceId: string,
    userId: string,
  ): Promise<{ userId: string; removed: true }> {
    const ws = await prisma.workspace.findFirst({
      where: { id: workspaceId, orgId, deletedAt: null },
    });
    if (!ws) throw new NotFoundError("Workspace");

    const user = await prisma.user.findFirst({ where: { id: userId, orgId } });
    if (!user) throw new NotFoundError("User");

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.MEMBER_REMOVED,
        aggregateId: workspaceId,
        aggregateType: "workspace",
        payload: { userId },
        actorId,
        actorType: ActorType.USER,
      }),
    ]);
    emitToOrg(orgId, "member.removed", { workspaceId, userId });

    return { userId, removed: true };
  }
}

export const workspacesService = new WorkspacesService();

// Re-export ConflictError so callers (and tests) can import it from here.
export { ConflictError };
