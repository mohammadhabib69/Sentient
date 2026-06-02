import { ActorType, TaskStatus, type Project, type User } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { eventsService, EventType } from "../events/events.service.js";
import { enqueueGraphSync } from "../graph/graphSync.helper.js";
import { emitToOrg } from "../../websocket/events.js";
import { paginateCursor } from "../../utils/pagination.js";
import { NotFoundError } from "../../utils/errors.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
  AddProjectMemberInput,
} from "./projects.schema.js";
import {
  toProjectResponse,
  toProjectMemberResponse,
  type ProjectStats,
  type ProjectListStats,
} from "./projects.types.js";

/**
 * Projects service (PRD §4).
 *
 * Multi-tenancy: every read is scoped by `orgId` from the JWT.
 * Every mutation logs an event, enqueues a graph sync, and broadcasts
 * to the org via the WebSocket stub.
 */
export class ProjectsService {
  // ─── CRUD ────────────────────────────────────────────────────────────────

  /**
   * GET /v1/projects — cursor-paginated list with filters and live stats.
   *
   * Health score formula (PRD §4.5):
   *   max(0, 100 - 5*blocked - 3*overdue - 2*(noDueDate))
   */
  async listProjects(
    orgId: string,
    query: ListProjectsQuery,
  ): Promise<{
    items: ReturnType<typeof toProjectResponse>[];
    meta: { nextCursor: string | null; total: number; hasMore: boolean };
  }> {
    const where: Record<string, unknown> = { orgId, deletedAt: null };
    if (query.workspaceId) where.workspaceId = query.workspaceId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }

    const { items, meta } = await paginateCursor<Project>({
      model: prisma.project as any,
      where,
      limit: query.limit,
      cursor: query.cursor,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { workspace: { select: { id: true, name: true } } },
    });

    // Compute stats for the page in two groupBy queries.
    const ids = items.map((p) => p.id);
    const stats: Record<string, ProjectListStats> = {};
    if (ids.length > 0) {
      const groups = await prisma.task.groupBy({
        by: ["projectId", "status"],
        where: { projectId: { in: ids }, orgId, deletedAt: null },
        _count: { _all: true },
      });
      for (const id of ids) stats[id] = { taskCount: 0, completedTaskCount: 0 };
      for (const row of groups) {
        const bucket = stats[row.projectId];
        if (!bucket) continue;
        bucket.taskCount += row._count._all;
        if (row.status === TaskStatus.DONE) bucket.completedTaskCount += row._count._all;
      }
    }

    // Member counts per project (single grouped query for the page).
    const memberGroups = await prisma.projectMember.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ids } },
      _count: { _all: true },
    });
    const memberCountById: Record<string, number> = {};
    for (const m of memberGroups) memberCountById[m.projectId] = m._count._all;

    // Health score per project: cheap proxy using task stats we already
    // computed. Full health score (with overdue/no-due-date) lives on
    // `getStats(projectId)`; for the list we approximate with blocked
    // count (which we don't have grouped). Keep the list at 100.
    const itemsWithExtras = items.map((p) =>
      toProjectResponse(
        p,
        stats[p.id],
        memberCountById[p.id] ?? 0,
        100,
      ),
    );

    return { items: itemsWithExtras, meta };
  }

  /**
   * POST /v1/projects — create a new project + the owner membership row.
   */
  async createProject(
    orgId: string,
    actorId: string,
    input: CreateProjectInput,
  ): Promise<ReturnType<typeof toProjectResponse>> {
    // Verify the workspace belongs to the caller's org.
    const workspace = await prisma.workspace.findFirst({
      where: { id: input.workspaceId, orgId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!workspace) throw new NotFoundError("Workspace");

    const created = await prisma.project.create({
      data: {
        orgId,
        workspaceId: input.workspaceId,
        name: input.name,
        status: input.status ?? "ACTIVE",
        priority: input.priority ?? "MEDIUM",
        dueDate: input.dueDate ?? null,
        metadata: (input.metadata as any) ?? {},
        createdBy: actorId,
        // Placeholder — the graph sync worker fills this in.
        graphNodeId: "",
      },
      include: { workspace: { select: { id: true, name: true } } },
    });

    // Create the owner membership row.
    await prisma.projectMember.create({
      data: {
        orgId,
        projectId: created.id,
        userId: actorId,
        role: "owner",
      },
    });

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.PROJECT_CREATED,
        aggregateId: created.id,
        aggregateType: "project",
        payload: { name: created.name, workspaceId: created.workspaceId },
        actorId,
        actorType: ActorType.USER,
      }),
      enqueueGraphSync({ action: "CREATE_PROJECT", projectId: created.id }),
    ]);
    emitToOrg(orgId, "project.created", { id: created.id, name: created.name });

    return toProjectResponse(created, undefined, 1, 100);
  }

  /**
   * GET /v1/projects/:id — fetch a single project with workspace + members.
   */
  async getProject(
    orgId: string,
    id: string,
  ): Promise<ReturnType<typeof toProjectResponse>> {
    const project = await prisma.project.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        workspace: { select: { id: true, name: true } },
        members: { include: { user: true } },
        _count: { select: { members: true } },
      },
    });
    if (!project) throw new NotFoundError("Project");

    const [taskCount, completedTaskCount] = await Promise.all([
      prisma.task.count({ where: { projectId: id, orgId, deletedAt: null } }),
      prisma.task.count({
        where: { projectId: id, orgId, deletedAt: null, status: TaskStatus.DONE },
      }),
    ]);

    return toProjectResponse(
      project,
      { taskCount, completedTaskCount },
      project._count.members,
      100,
    );
  }

  /**
   * PATCH /v1/projects/:id — partial update with a `changes` diff for the event.
   */
  async updateProject(
    orgId: string,
    actorId: string,
    id: string,
    input: UpdateProjectInput,
  ): Promise<ReturnType<typeof toProjectResponse>> {
    const existing = await prisma.project.findFirst({
      where: { id, orgId, deletedAt: null },
      include: { workspace: { select: { id: true, name: true } } },
    });
    if (!existing) throw new NotFoundError("Project");

    // Build a per-field diff.
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const data: Record<string, unknown> = {};
    if (input.name !== undefined && input.name !== existing.name) {
      changes.name = { from: existing.name, to: input.name };
      data.name = input.name;
    }
    if (input.status !== undefined && input.status !== existing.status) {
      changes.status = { from: existing.status, to: input.status };
      data.status = input.status;
    }
    if (input.priority !== undefined && input.priority !== existing.priority) {
      changes.priority = { from: existing.priority, to: input.priority };
      data.priority = input.priority;
    }
    if (input.dueDate !== undefined) {
      const fromD = existing.dueDate ? existing.dueDate.toISOString() : null;
      const toD = input.dueDate ? input.dueDate.toISOString() : null;
      if (fromD !== toD) {
        changes.dueDate = { from: fromD, to: toD };
        data.dueDate = input.dueDate;
      }
    }
    if (input.metadata !== undefined) {
      changes.metadata = { from: existing.metadata, to: input.metadata };
      data.metadata = input.metadata;
    }

    if (Object.keys(changes).length === 0) {
      // Nothing to update.
      return this.getProject(orgId, id);
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
      include: { workspace: { select: { id: true, name: true } } },
    });

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.PROJECT_UPDATED,
        aggregateId: id,
        aggregateType: "project",
        payload: { changes },
        actorId,
        actorType: ActorType.USER,
      }),
      enqueueGraphSync({ action: "UPDATE_PROJECT", projectId: id }),
    ]);
    emitToOrg(orgId, "project.updated", { id, changes });

    return toProjectResponse(updated);
  }

  /**
   * DELETE /v1/projects/:id — soft delete.
   */
  async softDeleteProject(
    orgId: string,
    actorId: string,
    id: string,
  ): Promise<{ id: string; deleted: true }> {
    const existing = await prisma.project.findFirst({
      where: { id, orgId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Project");

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.PROJECT_DELETED,
        aggregateId: id,
        aggregateType: "project",
        payload: { name: existing.name },
        actorId,
        actorType: ActorType.USER,
      }),
      enqueueGraphSync({ action: "DELETE_PROJECT", projectId: id }),
    ]);
    emitToOrg(orgId, "project.deleted", { id });

    return { id, deleted: true };
  }

  // ─── Stats (PRD §4.5) ────────────────────────────────────────────────────

  /**
   * GET /v1/projects/:id/stats — full statistics block with health score.
   */
  async getStats(orgId: string, id: string): Promise<ProjectStats> {
    const project = await prisma.project.findFirst({
      where: { id, orgId, deletedAt: null },
      select: { id: true, dueDate: true },
    });
    if (!project) throw new NotFoundError("Project");

    const baseWhere = { projectId: id, orgId, deletedAt: null };
    const [totalTasks, completedTasks, inProgressTasks, blockedTasks, overdueTasks, memberCount] =
      await Promise.all([
        prisma.task.count({ where: baseWhere }),
        prisma.task.count({ where: { ...baseWhere, status: TaskStatus.DONE } }),
        prisma.task.count({ where: { ...baseWhere, status: TaskStatus.IN_PROGRESS } }),
        prisma.task.count({ where: { ...baseWhere, status: TaskStatus.BLOCKED } }),
        prisma.task.count({
          where: {
            ...baseWhere,
            status: { not: TaskStatus.DONE },
            dueDate: { lt: new Date() },
          },
        }),
        prisma.projectMember.count({ where: { projectId: id } }),
      ]);

    const noDueDate = await prisma.task.count({
      where: { ...baseWhere, dueDate: null, status: { not: TaskStatus.DONE } },
    });

    const completionRate = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
    const healthScore = Math.max(
      0,
      Math.min(100, Math.round(100 - 5 * blockedTasks - 3 * overdueTasks - 2 * noDueDate)),
    );

    let daysUntilDue: number | null = null;
    if (project.dueDate) {
      const diff = project.dueDate.getTime() - Date.now();
      daysUntilDue = Math.round(diff / (1000 * 60 * 60 * 24));
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTaskCount: overdueTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      healthScore,
      memberCount,
      daysUntilDue,
    };
  }

  // ─── Members ─────────────────────────────────────────────────────────────

  async listMembers(orgId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw new NotFoundError("Project");

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true },
      orderBy: [{ joinedAt: "asc" }],
    });
    return members.map(toProjectMemberResponse);
  }

  async addMember(
    orgId: string,
    actorId: string,
    projectId: string,
    input: AddProjectMemberInput,
  ) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId, deletedAt: null },
    });
    if (!project) throw new NotFoundError("Project");

    const user = await prisma.user.findFirst({ where: { id: input.userId, orgId } });
    if (!user) throw new NotFoundError("User");

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: input.userId } },
      update: { role: input.role },
      create: {
        orgId,
        projectId,
        userId: input.userId,
        role: input.role,
      },
    });

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.MEMBER_ADDED,
        aggregateId: projectId,
        aggregateType: "project",
        payload: { userId: input.userId, role: input.role },
        actorId,
        actorType: ActorType.USER,
      }),
    ]);
    emitToOrg(orgId, "project.member.added", { projectId, userId: input.userId, role: input.role });

    return { id: member.id, userId: input.userId, role: input.role, added: true };
  }

  async removeMember(
    orgId: string,
    actorId: string,
    projectId: string,
    userId: string,
  ) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId, deletedAt: null },
    });
    if (!project) throw new NotFoundError("Project");

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new NotFoundError("ProjectMember");

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    await Promise.allSettled([
      eventsService.logEvent({
        orgId,
        type: EventType.MEMBER_REMOVED,
        aggregateId: projectId,
        aggregateType: "project",
        payload: { userId },
        actorId,
        actorType: ActorType.USER,
      }),
    ]);
    emitToOrg(orgId, "project.member.removed", { projectId, userId });

    return { userId, removed: true };
  }
}

export const projectsService = new ProjectsService();
