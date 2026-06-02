import { prisma } from "../../config/prisma.js";
import { neo4jDriver } from "../../config/neo4j.js";
import { enqueueGraphSync } from "./graphSync.helper.js";

/**
 * GraphService — read-side queries against Neo4j (PRD §9.4).
 */
export class GraphService {
  /**
   * GET /v1/graph — full org graph (nodes + edges + bottlenecks + stats).
   */
  async getOrgGraph(orgId: string) {
    const session = neo4jDriver.session();
    try {
      const result = await session.run(
        `MATCH (n) WHERE n.orgId = $orgId
         OPTIONAL MATCH (n)-[r]->(m)
         RETURN n, r, m`,
        { orgId },
      );
      const nodes: Array<{ id: string; label: string; properties: Record<string, unknown> }> = [];
      const edges: Array<{ from: string; to: string; type: string }> = [];
      const seenNodes = new Set<string>();
      for (const record of result.records) {
        const n = record.get("n");
        const r = record.get("r");
        const m = record.get("m");
        if (n && !seenNodes.has(n.identity.toString())) {
          seenNodes.add(n.identity.toString());
          nodes.push({
            id: n.properties.id,
            label: n.labels[0] ?? "Unknown",
            properties: n.properties,
          });
        }
        if (m && !seenNodes.has(m.identity.toString())) {
          seenNodes.add(m.identity.toString());
          nodes.push({
            id: m.properties.id,
            label: m.labels[0] ?? "Unknown",
            properties: m.properties,
          });
        }
        if (r) {
          edges.push({ from: n.properties.id, to: m.properties.id, type: r.type });
        }
      }

      // Bottlenecks = tasks with status=BLOCKED.
      const bottlenecks = nodes.filter(
        (n) => n.label === "Task" && (n.properties as any).status === "BLOCKED",
      );

      const stats = {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        workspaceCount: nodes.filter((n) => n.label === "Workspace").length,
        projectCount: nodes.filter((n) => n.label === "Project").length,
        taskCount: nodes.filter((n) => n.label === "Task").length,
        userCount: nodes.filter((n) => n.label === "User").length,
        bottleneckCount: bottlenecks.length,
      };

      return { nodes, edges, bottlenecks, stats };
    } finally {
      await session.close();
    }
  }

  /**
   * GET /v1/graph/bottlenecks — tasks blocked.
   */
  async getBottlenecks(orgId: string) {
    const session = neo4jDriver.session();
    try {
      const result = await session.run(
        `MATCH (t:Task {orgId: $orgId, status: 'BLOCKED'})
         RETURN t`,
        { orgId },
      );
      return result.records.map((r) => r.get("t").properties);
    } finally {
      await session.close();
    }
  }

  /**
   * GET /v1/graph/critical-path/:projectId — placeholder (deferred).
   */
  async getCriticalPath(_projectId: string): Promise<unknown[]> {
    return [];
  }

  /**
   * GET /v1/graph/neighbors/:nodeId?depth=N — variable-length path query.
   */
  async getNeighbors(nodeId: string, depth: number = 1) {
    const session = neo4jDriver.session();
    try {
      const result = await session.run(
        `MATCH p = (n {id: $nodeId})-[*1..${Math.max(1, Math.min(depth, 5))}]-(m)
         RETURN p, m`,
        { nodeId },
      );
      return result.records.map((r) => ({
        path: r.get("p").segments.map((seg: any) => ({
          from: seg.start.properties.id,
          rel: seg.relationship.type,
          to: seg.end.properties.id,
        })),
        node: r.get("m").properties,
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * POST /v1/graph/rebuild — enqueue a full org rebuild job.
   * (Admin only; the actual job handler lives in graphSync.worker.ts.)
   */
  async rebuildOrgGraph(orgId: string): Promise<{ queued: true }> {
    await enqueueGraphSync({ action: "REBUILD_ORG_GRAPH", orgId });
    return { queued: true };
  }
}

export const graphService = new GraphService();
