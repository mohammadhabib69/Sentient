import { prisma } from "../../config/prisma.js";
import { neo4jDriver } from "../../config/neo4j.js";
import { GraphSyncJob } from "./graphSync.helper.js";

/**
 * GraphCypherService — one method per `GraphSyncJob.action`.
 *
 * For every action we open a Neo4j session, MERGE the relevant node(s),
 * and (re)write the relationships. Idempotent: running the same action
 * twice produces the same graph state.
 */
export class GraphCypherService {
  private async withSession<T>(fn: (run: (q: string, params?: Record<string, unknown>) => Promise<unknown>) => Promise<T>): Promise<T> {
    const session = neo4jDriver.session();
    try {
      return await fn((q, params) => session.run(q, params));
    } finally {
      await session.close();
    }
  }

  // ─── Workspaces ─────────────────────────────────────────────────────────

  async syncWorkspace(action: { action: "CREATE_WORKSPACE" | "UPDATE_WORKSPACE"; workspaceId: string }): Promise<void> {
    const ws = await prisma.workspace.findUnique({
      where: { id: action.workspaceId },
      include: { organization: true },
    });
    if (!ws) return;
    await this.withSession(async (run) => {
      await run(
        `MERGE (o:Organization {id: $orgId})
         ON CREATE SET o.name = $orgName, o.plan = $orgPlan, o.slug = $orgSlug
         MERGE (w:Workspace {id: $id})
         SET w.orgId = $orgId, w.name = $name, w.deletedAt = $deletedAt
         MERGE (w)-[:BELONGS_TO]->(o)`,
        {
          orgId: ws.orgId,
          orgName: ws.organization.name,
          orgPlan: ws.organization.plan,
          orgSlug: ws.organization.slug,
          id: ws.id,
          name: ws.name,
          deletedAt: ws.deletedAt ? ws.deletedAt.toISOString() : null,
        },
      );
    });
  }

  async deleteWorkspace(action: { action: "DELETE_WORKSPACE"; workspaceId: string }): Promise<void> {
    await this.withSession(async (run) => {
      await run("MATCH (w:Workspace {id: $id}) DETACH DELETE w", { id: action.workspaceId });
    });
  }

  // ─── Projects ───────────────────────────────────────────────────────────

  async syncProject(action: { action: "CREATE_PROJECT" | "UPDATE_PROJECT"; projectId: string }): Promise<void> {
    const p = await prisma.project.findUnique({
      where: { id: action.projectId },
      include: { workspace: true },
    });
    if (!p) return;
    await this.withSession(async (run) => {
      await run(
        `MERGE (w:Workspace {id: $workspaceId})
         MERGE (p:Project {id: $id})
         SET p.orgId = $orgId, p.workspaceId = $workspaceId, p.name = $name,
             p.status = $status, p.priority = $priority, p.deletedAt = $deletedAt
         MERGE (p)-[:IN_WORKSPACE]->(w)`,
        {
          id: p.id,
          orgId: p.orgId,
          workspaceId: p.workspaceId,
          name: p.name,
          status: p.status,
          priority: p.priority,
          deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
        },
      );
    });
  }

  async deleteProject(action: { action: "DELETE_PROJECT"; projectId: string }): Promise<void> {
    await this.withSession(async (run) => {
      await run("MATCH (p:Project {id: $id}) DETACH DELETE p", { id: action.projectId });
    });
  }

  // ─── Tasks ──────────────────────────────────────────────────────────────

  async syncTask(action: { action: "CREATE_TASK" | "UPDATE_TASK"; taskId: string }): Promise<void> {
    const t = await prisma.task.findUnique({
      where: { id: action.taskId },
      include: { project: true, assignee: true, parentTask: true },
    });
    if (!t) return;
    await this.withSession(async (run) => {
      await run(
        `MERGE (p:Project {id: $projectId})
         MERGE (t:Task {id: $id})
         SET t.orgId = $orgId, t.projectId = $projectId, t.title = $title,
             t.status = $status, t.priority = $priority, t.position = $position,
             t.deletedAt = $deletedAt
         MERGE (t)-[:IN_PROJECT]->(p)`,
        {
          id: t.id,
          orgId: t.orgId,
          projectId: t.projectId,
          title: t.title,
          status: t.status,
          priority: t.priority,
          position: t.position,
          deletedAt: t.deletedAt ? t.deletedAt.toISOString() : null,
        },
      );
      if (t.parentTaskId) {
        await run(
          `MATCH (t:Task {id: $id}), (p:Task {id: $parentId})
           MERGE (t)-[:SUBTASK_OF]->(p)`,
          { id: t.id, parentId: t.parentTaskId },
        );
      }
      if (t.assigneeId) {
        await run(
          `MERGE (u:User {id: $userId})
           MATCH (t:Task {id: $taskId})
           MERGE (t)-[:ASSIGNED_TO]->(u)`,
          { userId: t.assigneeId, taskId: t.id },
        );
      }
    });
  }

  async deleteTask(action: { action: "DELETE_TASK"; taskId: string }): Promise<void> {
    await this.withSession(async (run) => {
      await run("MATCH (t:Task {id: $id}) DETACH DELETE t", { id: action.taskId });
    });
  }

  async syncTaskAssign(action: { action: "ASSIGN_TASK"; taskId: string; userId: string }): Promise<void> {
    await this.withSession(async (run) => {
      await run(
        `MERGE (u:User {id: $userId})
         MERGE (t:Task {id: $taskId})
         MERGE (t)-[:ASSIGNED_TO]->(u)`,
        { userId: action.userId, taskId: action.taskId },
      );
    });
  }

  // ─── Members ────────────────────────────────────────────────────────────

  async syncMember(action: { action: "ADD_MEMBER"; workspaceId: string; userId: string }): Promise<void> {
    await this.withSession(async (run) => {
      await run(
        `MERGE (u:User {id: $userId})
         MERGE (w:Workspace {id: $workspaceId})
         MERGE (u)-[:MEMBER_OF]->(w)`,
        { userId: action.userId, workspaceId: action.workspaceId },
      );
    });
  }

  // ─── Dispatcher ─────────────────────────────────────────────────────────

  async handle(job: GraphSyncJob): Promise<void> {
    switch (job.action) {
      case "CREATE_WORKSPACE":
      case "UPDATE_WORKSPACE":
        await this.syncWorkspace(job);
        break;
      case "DELETE_WORKSPACE":
        await this.deleteWorkspace(job);
        break;
      case "CREATE_PROJECT":
      case "UPDATE_PROJECT":
        await this.syncProject(job);
        break;
      case "DELETE_PROJECT":
        await this.deleteProject(job);
        break;
      case "CREATE_TASK":
      case "UPDATE_TASK":
        await this.syncTask(job);
        break;
      case "DELETE_TASK":
        await this.deleteTask(job);
        break;
      case "ASSIGN_TASK":
        await this.syncTaskAssign(job);
        break;
      case "ADD_MEMBER":
        await this.syncMember(job);
        break;
      // REBUILD_ORG_GRAPH is handled by the worker (uses the bulk service).
      case "REBUILD_ORG_GRAPH":
        // No-op here.
        break;
    }
  }
}

export const graphCypherService = new GraphCypherService();
