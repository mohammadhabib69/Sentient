import { prisma } from "../../config/prisma.js";
import type { SearchQuery } from "./search.schema.js";

/**
 * Search service (PRD §8).
 *
 * Case-insensitive `contains` on title/name. We sort by title-match
 * precedence (starts-with > contains) and break ties with createdAt
 * descending.
 */
export class SearchService {
  async search(orgId: string, query: SearchQuery) {
    const { q, types, limit } = query;
    const result: {
      tasks: any[];
      projects: any[];
      workspaces: any[];
    } = { tasks: [], projects: [], workspaces: [] };

    if (types.includes("task")) {
      const rows = await prisma.task.findMany({
        where: { orgId, deletedAt: null, title: { contains: q, mode: "insensitive" } },
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: { project: { select: { id: true, name: true } } },
      });
      result.tasks = rows.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }));
    }

    if (types.includes("project")) {
      const rows = await prisma.project.findMany({
        where: { orgId, deletedAt: null, name: { contains: q, mode: "insensitive" } },
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: { workspace: { select: { id: true, name: true } } },
      });
      result.projects = rows.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));
    }

    if (types.includes("workspace")) {
      const rows = await prisma.workspace.findMany({
        where: { orgId, deletedAt: null, name: { contains: q, mode: "insensitive" } },
        take: limit,
        orderBy: [{ createdAt: "desc" }],
      });
      result.workspaces = rows.map((w) => ({ ...w, createdAt: w.createdAt.toISOString() }));
    }

    return result;
  }
}

export const searchService = new SearchService();
