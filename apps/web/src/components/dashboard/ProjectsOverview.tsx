"use client";

import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

export function ProjectsOverview() {
  const { data: projects = [], isLoading } = useProjects();

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-2)]" />;
  }

  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)]">
      <div className="border-b border-[var(--glass-border)] px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Active Projects</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] text-[var(--foreground-3)]">
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Health</th>
              <th className="px-5 py-3 font-medium text-right">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--glass-border)]">
            {projects.map((project) => (
              <tr key={project.id} className="transition-colors hover:bg-[var(--surface-2)]">
                <td className="px-5 py-3 font-medium text-foreground">{project.name}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full border border-[var(--glass-border)] bg-[var(--surface-3)] px-2 py-0.5 text-xs text-[var(--foreground-2)] capitalize">
                    {project.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-medium",
                      project.health === "good" ? "text-green" : "text-amber",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        project.health === "good" ? "bg-green" : "bg-amber",
                      )}
                    />
                    {project.health === "good" ? "On Track" : "At Risk"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-[var(--foreground-2)]">
                  {new Date(project.dueDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
