import { Worker, type Job } from "bullmq";
import { GraphSyncService } from "@sentient/graph";
import { bullRedisClient } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { neo4jDriver } from "../config/neo4j.js";
import { env } from "../config/env.js";
import { graphCypherService } from "../modules/graph/graphCypher.service.js";
import { GraphSyncJob } from "../modules/graph/graphSync.helper.js";

/**
 * graphSync.worker — handles every per-CRUD `GraphSyncJob`.
 *
 * - For per-action jobs (CREATE_WORKSPACE, UPDATE_TASK, …) we delegate
 *   to `graphCypherService.handle(job)`.
 * - For `REBUILD_ORG_GRAPH` we re-sync the whole org in one shot using
 *   the bulk `@sentient/graph` GraphSyncService.
 */
export const graphSyncWorker = new Worker<GraphSyncJob>(
  "graph-sync-queue",
  async (job: Job<GraphSyncJob>) => {
    const data = job.data;
    if (process.env.NODE_ENV !== "production") {
      console.log(`[graphSync] job=${job.id} action=${data.action}`);
    }

    if (data.action === "REBUILD_ORG_GRAPH") {
      const bulk = new GraphSyncService(neo4jDriver, { database: (env as any).NEO4J_DATABASE });
      const org = await prisma.organization.findUnique({ where: { id: data.orgId } });
      if (!org) return;

      const [users, workspaces, projects, tasks, agents] = await Promise.all([
        prisma.user.findMany({ where: { orgId: data.orgId } }),
        prisma.workspace.findMany({ where: { orgId: data.orgId, deletedAt: null } }),
        prisma.project.findMany({ where: { orgId: data.orgId, deletedAt: null } }),
        prisma.task.findMany({ where: { orgId: data.orgId, deletedAt: null } }),
        prisma.agent.findMany({ where: { orgId: data.orgId } }),
      ]);

      await bulk.syncOrganizationGraph({
        organization: { id: org.id, name: org.name, plan: org.plan, slug: org.slug },
        users: users.map((u) => ({ id: u.id, orgId: u.orgId, name: u.name, role: u.role })),
        workspaces: workspaces.map((w) => ({ id: w.id, orgId: w.orgId, name: w.name })),
        projects: projects.map((p) => ({
          id: p.id, workspaceId: p.workspaceId, orgId: p.orgId, name: p.name,
          status: p.status, priority: p.priority,
        })),
        tasks: tasks.map((t) => ({
          id: t.id, projectId: t.projectId, orgId: t.orgId, title: t.title,
          status: t.status, priority: t.priority, assigneeId: t.assigneeId,
          parentTaskId: t.parentTaskId,
        })),
        agents: agents.map((a) => ({ id: a.id, orgId: a.orgId, name: a.name, type: a.type })),
      });
      return;
    }

    // Per-action jobs go through the typed dispatcher.
    await graphCypherService.handle(data);
  },
  { connection: bullRedisClient },
);

graphSyncWorker.on("failed", (job, err) => {
  console.error(`[graphSync] job=${job?.id} action=${job?.data?.action} FAILED:`, err.message);
});
graphSyncWorker.on("completed", (job) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[graphSync] job=${job.id} action=${job.data.action} completed`);
  }
});
