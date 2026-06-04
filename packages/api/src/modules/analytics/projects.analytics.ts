import { ProjectStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import type { ProjectHealth, ProjectHealthMetrics } from "./analytics.types.js";

/**
 * Project health analytics — reads the `ProjectReadModel` projector output
 * and joins with the live `Project` table for due-date lookups (which the
 * read model does not currently store).
 */
export class ProjectsAnalyticsService {
  async getProjectHealth(
    orgId: string,
    limit: number,
  ): Promise<ProjectHealthMetrics> {
    const [rows, projects] = await Promise.all([
      prisma.projectReadModel.findMany({
        where: { orgId },
        orderBy: { healthScore: "asc" },
        take: limit,
      }),
      prisma.project.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true, dueDate: true, status: true },
      }),
    ]);

    const dueById = new Map(projects.map((p) => [p.id, p.dueDate]));
    const statusById = new Map(projects.map((p) => [p.id, p.status]));

    const mapped: ProjectHealth[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: statusById.get(r.id) ?? r.status,
      totalTasks: r.totalTasks,
      completedTasks: r.completedTasks,
      inProgressTasks: r.inProgressTasks,
      blockedTasks: r.blockedTasks,
      overdueTaskCount: r.overdueTaskCount,
      healthScore: r.healthScore,
      dueDate: (dueById.get(r.id) ?? null)?.toISOString() ?? null,
    }));

    const avgHealth =
      rows.length > 0
        ? Math.round(
            rows.reduce((sum, r) => sum + r.healthScore, 0) / rows.length,
          )
        : 100;

    const overdueProjects = projects.filter(
      (p) =>
        p.dueDate !== null &&
        p.dueDate < new Date() &&
        p.status !== ProjectStatus.COMPLETED,
    ).length;

    return {
      projects: mapped,
      avgHealth,
      totalProjects: rows.length,
      activeProjects: projects.filter((p) => p.status === ProjectStatus.ACTIVE).length,
      overdueProjects,
      blockedTasks: rows.reduce((sum, r) => sum + r.blockedTasks, 0),
    };
  }
}

export const projectsAnalyticsService = new ProjectsAnalyticsService();
