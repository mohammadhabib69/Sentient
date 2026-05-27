"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  CheckSquare,
  Bot,
  X,
  FolderOpen,
  Filter,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageTransition } from "@/components/shared/PageTransition";

interface Project {
  id: string;
  name: string;
  description: string;
  workspace: string;
  status: "IN PROGRESS" | "BLOCKED" | "ACTIVE" | "PAUSED" | string;
  tasksCount: number;
  members: string[];
  dueDate: string;
  isOverdue?: boolean;
  leadAgent: {
    initials: string;
    name: string;
  } | null;
  health: string;
  progress: number;
  priority: "Low" | "Medium" | "High" | "Critical";
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Core Refactor Q3",
    description: "Refactor the core architecture to support new agent modules",
    workspace: "Engineering",
    status: "IN PROGRESS",
    tasksCount: 8,
    members: ["FL", "AH", "MS"],
    dueDate: "Jun 30",
    isOverdue: false,
    leadAgent: { initials: "FL", name: "Flux" },
    health: "94%",
    progress: 60,
    priority: "High",
  },
  {
    id: "proj-2",
    name: "Stripe API Migration",
    description: "Migrate payment processing to Stripe v3 API",
    workspace: "Engineering",
    status: "BLOCKED",
    tasksCount: 6,
    members: ["NV", "KB"],
    dueDate: "Jun 15",
    isOverdue: true,
    leadAgent: { initials: "NV", name: "Nova" },
    health: "62%",
    progress: 40,
    priority: "Critical",
  },
  {
    id: "proj-3",
    name: "Q4 Campaign",
    description: "Plan and execute the product marketing campaign for Q4 launch.",
    workspace: "Marketing",
    status: "ACTIVE",
    tasksCount: 10,
    members: ["EC", "JD", "TL", "AM"],
    dueDate: "Nov 30",
    isOverdue: false,
    leadAgent: { initials: "EC", name: "Echo" },
    health: "88%",
    progress: 70,
    priority: "Medium",
  },
  {
    id: "proj-4",
    name: "Brand Refresh",
    description: "Create new brand guidelines, icons, logos, and color palette.",
    workspace: "Marketing",
    status: "PAUSED",
    tasksCount: 0,
    members: ["KS"],
    dueDate: "Dec 15",
    isOverdue: false,
    leadAgent: null,
    health: "—",
    progress: 0,
    priority: "Low",
  },
];

const getWorkspaceIcon = (workspace: string) => {
  switch (workspace.toLowerCase()) {
    case "engineering":
      return "⚙";
    case "marketing":
      return "📣";
    case "design":
      return "🎨";
    case "operations":
      return "💼";
    case "finance":
      return "💵";
    default:
      return "📁";
  }
};

const getHealthColor = (health: string) => {
  if (health === "—") return "text-[var(--foreground-3)]";
  const val = parseInt(health);
  if (isNaN(val)) return "text-[var(--foreground-3)]";
  if (val >= 85) return "text-green";
  if (val >= 60) return "text-amber";
  return "text-red";
};

const getProgressBg = (project: Project) => {
  if (project.status === "BLOCKED") return "bg-red";
  if (project.status === "PAUSED") return "bg-muted";
  if (project.workspace === "Engineering") return "bg-forest-green";
  if (project.workspace === "Marketing") return "bg-primary";
  return "bg-primary";
};

const renderStatusBadge = (status: string) => {
  let classes = "bg-[var(--surface-2)] text-[var(--foreground-3)]";
  if (status === "IN PROGRESS") classes = "bg-primary/12 text-primary";
  if (status === "BLOCKED") classes = "bg-red/12 text-red";
  if (status === "ACTIVE") classes = "bg-green/12 text-green";
  if (status === "PAUSED") classes = "bg-[var(--surface-2)] text-[var(--foreground-3)]";

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider",
        classes,
      )}
    >
      {status}
    </span>
  );
};

const formatDueDate = (dateStr: string) => {
  if (!dateStr) return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const monthIndex = parseInt(parts[1] || "", 10) - 1;
    const day = parseInt(parts[2] || "", 10);
    if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
      const month = months[monthIndex];
      if (month) {
        return `${month} ${day}`;
      }
    }
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>(DEFAULT_PROJECTS);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = React.useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [workspaceFilter, setWorkspaceFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Modal Form State
  const [name, setName] = React.useState("");
  const [workspace, setWorkspace] = React.useState("Engineering");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState("Medium");
  const [dueDate, setDueDate] = React.useState("");
  const [leadAgent, setLeadAgent] = React.useState("None");

  const handleDeleteProject = (id: string, name: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast.error(`Project "${name}" was deleted.`);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let formattedDate = "Dec 31";
    let isOverdue = false;
    if (dueDate) {
      formattedDate = formatDueDate(dueDate);
      const today = new Date("2026-05-26"); // system base reference
      const selectedDate = new Date(dueDate);
      if (selectedDate < today) {
        isOverdue = true;
      }
    }

    let lead = null;
    if (leadAgent === "Aria") lead = { initials: "AR", name: "Aria" };
    else if (leadAgent === "Nova") lead = { initials: "NV", name: "Nova" };
    else if (leadAgent === "Echo") lead = { initials: "EC", name: "Echo" };
    else if (leadAgent === "Flux") lead = { initials: "FL", name: "Flux" };

    const tasks = Math.floor(Math.random() * 8) + 2; // Mock realistic task count
    const membersCount = lead
      ? Math.floor(Math.random() * 3) + 2
      : Math.floor(Math.random() * 2) + 1;

    const initialsPool = ["AH", "MS", "KB", "JD", "TL", "AM", "KS", "PR", "DK", "NL"];
    const projectMembers: string[] = [];
    if (lead) {
      projectMembers.push(lead.initials);
    }
    while (projectMembers.length < membersCount) {
      const randomInitial = initialsPool[Math.floor(Math.random() * initialsPool.length)] || "";
      if (randomInitial && !projectMembers.includes(randomInitial)) {
        projectMembers.push(randomInitial);
      }
    }

    const randomProgress = Math.floor(Math.random() * 8) * 10 + 10; // 10% to 80%
    const randomHealthNum = Math.floor(Math.random() * 35) + 65; // 65% to 100%
    const healthStr = `${randomHealthNum}%`;

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name,
      description: description || "No description provided.",
      workspace,
      status: "ACTIVE",
      tasksCount: tasks,
      members: projectMembers,
      dueDate: formattedDate,
      isOverdue,
      leadAgent: lead,
      health: healthStr,
      progress: randomProgress,
      priority: priority as any,
    };

    setProjects((prev) => [...prev, newProj]);

    // Reset Form
    setName("");
    setDescription("");
    setWorkspace("Engineering");
    setPriority("Medium");
    setDueDate("");
    setLeadAgent("None");

    setShowModal(false);
    toast.success(`Project "${newProj.name}" created successfully in ${newProj.workspace}`);
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWorkspace =
      workspaceFilter === "ALL" || p.workspace.toLowerCase() === workspaceFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "ALL" || p.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesWorkspace && matchesStatus;
  });

  // Group by Workspace dynamically
  const groupedProjects = filteredProjects.reduce<Record<string, Project[]>>((acc, proj) => {
    const list = acc[proj.workspace] || [];
    list.push(proj);
    acc[proj.workspace] = list;
    return acc;
  }, {});

  // Header dynamic stats
  const activeProjectsCount = projects.filter((p) => p.status !== "PAUSED").length;
  const workspacesSet = new Set(projects.map((p) => p.workspace));
  const workspacesCount = workspacesSet.size;
  const statsSubtitle = `${workspacesCount} workspace${workspacesCount !== 1 ? "s" : ""} · ${activeProjectsCount} active project${activeProjectsCount !== 1 ? "s" : ""}`;

  return (
    <PageTransition className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Projects</h2>
          <p className="text-xs text-[var(--foreground-2)]">{statsSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "grid"
                  ? "bg-[var(--surface-1)] text-foreground shadow-sm"
                  : "text-[var(--foreground-3)] hover:text-foreground",
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-[var(--surface-1)] text-foreground shadow-sm"
                  : "text-[var(--foreground-3)] hover:text-foreground",
              )}
              title="List View"
            >
              <ListIcon className="size-4" />
            </button>
          </div>

          {/* New Project Button */}
          <Button
            onClick={() => setShowModal(true)}
            variant="default"
            size="sm"
            className="flex items-center gap-1 text-xs font-semibold"
          >
            <Plus className="size-3.5" /> New Project
          </Button>
        </div>
      </div>

      {/* Filters Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[var(--surface-2)]/40 p-3 rounded-xl border border-[var(--glass-border)]">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto flex-1">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--foreground-3)]" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-1)] pl-9 pr-3 text-xs text-foreground placeholder-[var(--foreground-3)] outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Workspace Filter */}
          <select
            value={workspaceFilter}
            onChange={(e) => setWorkspaceFilter(e.target.value)}
            className="w-full sm:w-auto h-9 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-1)] px-3 text-xs text-foreground outline-none focus:border-primary"
          >
            <option value="ALL">All Workspaces</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Design">Design</option>
            <option value="Operations">Operations</option>
            <option value="Finance">Finance</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto h-9 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-1)] px-3 text-xs text-foreground outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery !== "" || workspaceFilter !== "ALL" || statusFilter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setWorkspaceFilter("ALL");
              setStatusFilter("ALL");
            }}
            className="text-xs text-[var(--foreground-3)] hover:text-foreground h-9"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Projects List Container */}
      <div className="space-y-8">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={projects.length === 0 ? "No projects created yet" : "No matching projects"}
            description={
              projects.length === 0
                ? "Get started by creating your first workspace project to orchestrate agent workflows."
                : "No projects match your current search queries or filters. Try adjusting them."
            }
            actionLabel={projects.length === 0 ? "New Project +" : "Clear Filters"}
            onAction={
              projects.length === 0
                ? () => setShowModal(true)
                : () => {
                    setSearchQuery("");
                    setWorkspaceFilter("ALL");
                    setStatusFilter("ALL");
                  }
            }
          />
        ) : (
          Object.entries(groupedProjects).map(([workspaceName, workspaceProjects]) => {
            const icon = getWorkspaceIcon(workspaceName);

            return (
              <div key={workspaceName} className="space-y-4">
                {/* Workspace Section Header */}
                <div className="flex items-center gap-2 border-b border-[var(--glass-border)] pb-2">
                  <span className="text-sm">{icon}</span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--foreground-2)]">
                    {workspaceName} · {workspaceProjects.length} project
                    {workspaceProjects.length !== 1 ? "s" : ""}
                  </h3>
                </div>

                {/* Projects Display */}
                {viewMode === "grid" ? (
                  /* Grid View */
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {workspaceProjects.map((project) => (
                      <div
                        key={project.id}
                        className="glass-panel p-5 bg-[var(--surface-1)] hover:bg-[var(--surface-2)]/20 transition-all duration-300 rounded-xl border border-[var(--glass-border)] shadow-sm flex flex-col justify-between min-h-[220px] relative group overflow-hidden"
                      >
                        {/* Top half */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            {/* Workspace Name */}
                            <span className="text-[10px] font-mono text-[var(--foreground-3)] uppercase tracking-wider">
                              {getWorkspaceIcon(project.workspace)} {project.workspace}
                            </span>
                            {/* Status Badge & Trash Action */}
                            <div className="flex items-center gap-1.5">
                              {renderStatusBadge(project.status)}
                              <button
                                onClick={() => handleDeleteProject(project.id, project.name)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red text-[var(--foreground-3)] hover:bg-[var(--surface-3)] rounded transition-all"
                                title="Delete Project"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Title & Priority */}
                          <div className="flex items-start justify-between gap-2 pt-1">
                            <Link href={`/projects/${project.id}`}>
                              <h4 className="text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1 leading-snug">
                                {project.name}
                              </h4>
                            </Link>
                            <Badge
                              variant={project.priority.toLowerCase() as any}
                              className="scale-90 origin-right"
                            >
                              {project.priority}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-[var(--foreground-2)] line-clamp-2 mt-1 min-h-[2rem] leading-relaxed">
                            {project.description}
                          </p>
                        </div>

                        {/* Bottom half stats */}
                        <div className="space-y-3 pt-3">
                          {/* Stats row */}
                          <div className="flex items-center justify-between text-xs text-[var(--foreground-2)] border-t border-[var(--glass-border)]/50 pt-2.5">
                            {/* Tasks and Members */}
                            <div className="flex items-center gap-2">
                              <span
                                className="flex items-center gap-1"
                                title={`${project.tasksCount} tasks`}
                              >
                                <CheckSquare className="size-3.5 text-[var(--foreground-3)]" />
                                <span className="font-mono text-xs">{project.tasksCount}</span>
                              </span>
                              <span className="text-[var(--foreground-3)]">·</span>

                              {/* Member stack */}
                              <div className="flex -space-x-1.5">
                                {project.members.slice(0, 3).map((initials, idx) => (
                                  <div
                                    key={idx}
                                    className="inline-flex size-5 items-center justify-center rounded-full border border-background bg-[var(--surface-3)] text-[9px] font-bold text-foreground ring-1 ring-black/5"
                                    title={`Member: ${initials}`}
                                  >
                                    {initials}
                                  </div>
                                ))}
                                {project.members.length > 3 && (
                                  <div
                                    className="inline-flex size-5 items-center justify-center rounded-full border border-background bg-[var(--surface-2)] text-[8px] font-bold text-[var(--foreground-3)] ring-1 ring-black/5"
                                    title={`${project.members.length - 3} more members`}
                                  >
                                    +{project.members.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Due Date */}
                            <span
                              className={cn(
                                "flex items-center gap-1 font-mono text-[11px]",
                                project.isOverdue
                                  ? "text-red font-bold"
                                  : "text-[var(--foreground-3)]",
                              )}
                            >
                              <Calendar className="size-3.5" />
                              <span>Due {project.dueDate}</span>
                            </span>
                          </div>

                          {/* Lead Agent & Health */}
                          <div className="flex items-center justify-between text-xs">
                            {/* Agent Chip */}
                            <div>
                              {project.leadAgent ? (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--glass-border)] text-[10px] font-medium text-[var(--foreground-2)]">
                                  <span className="size-1 bg-primary rounded-full" />
                                  <span className="font-mono text-[9px] text-[var(--foreground-3)]">
                                    {project.leadAgent.initials}
                                  </span>
                                  <span>{project.leadAgent.name}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-[var(--foreground-3)] italic">
                                  No Lead
                                </span>
                              )}
                            </div>

                            {/* Health */}
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <span className="text-[var(--foreground-3)]">Health:</span>
                              <span className={cn("font-bold", getHealthColor(project.health))}>
                                {project.health}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar overlay */}
                        <div className="w-full space-y-1 mt-3">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--foreground-3)]">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                getProgressBg(project),
                              )}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* List View */
                  <div className="space-y-2">
                    {workspaceProjects.map((project) => (
                      <div
                        key={project.id}
                        className="glass-panel p-4 bg-[var(--surface-1)] hover:bg-[var(--surface-2)]/20 transition-all duration-300 rounded-xl border border-[var(--glass-border)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                      >
                        {/* Title, status, desc */}
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/projects/${project.id}`}>
                              <h4 className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate">
                                {project.name}
                              </h4>
                            </Link>
                            <span className="text-[10px] font-mono text-[var(--foreground-3)] uppercase tracking-wider bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--glass-border)]">
                              {getWorkspaceIcon(project.workspace)} {project.workspace}
                            </span>
                            {renderStatusBadge(project.status)}
                            <Badge
                              variant={project.priority.toLowerCase() as any}
                              className="scale-90"
                            >
                              {project.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-[var(--foreground-2)] truncate max-w-xl">
                            {project.description}
                          </p>
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-x-6 gap-y-2 text-xs">
                          {/* Tasks */}
                          <div className="flex items-center gap-1 w-[70px]" title="Tasks">
                            <CheckSquare className="size-3.5 text-[var(--foreground-3)]" />
                            <span className="font-mono text-xs">{project.tasksCount} tasks</span>
                          </div>

                          {/* Member Stack */}
                          <div className="flex -space-x-1.5 w-[50px]">
                            {project.members.slice(0, 3).map((initials, idx) => (
                              <div
                                key={idx}
                                className="inline-flex size-5 items-center justify-center rounded-full border border-background bg-[var(--surface-3)] text-[9px] font-bold text-foreground ring-1 ring-black/5"
                                title={`Member: ${initials}`}
                              >
                                {initials}
                              </div>
                            ))}
                            {project.members.length > 3 && (
                              <div
                                className="inline-flex size-5 items-center justify-center rounded-full border border-background bg-[var(--surface-2)] text-[8px] font-bold text-[var(--foreground-3)] ring-1 ring-black/5"
                                title={`${project.members.length - 3} more members`}
                              >
                                +{project.members.length - 3}
                              </div>
                            )}
                          </div>

                          {/* Lead Agent */}
                          <div className="w-[100px] flex justify-start">
                            {project.leadAgent ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--glass-border)] text-[9px] font-medium text-[var(--foreground-2)] truncate max-w-full">
                                <span className="size-1 bg-primary rounded-full" />
                                <span>{project.leadAgent.name}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-[var(--foreground-3)] italic">
                                No Lead
                              </span>
                            )}
                          </div>

                          {/* Due Date */}
                          <div
                            className={cn(
                              "w-[90px] text-right font-mono text-[11px]",
                              project.isOverdue
                                ? "text-red font-bold"
                                : "text-[var(--foreground-3)]",
                            )}
                          >
                            Due {project.dueDate}
                          </div>

                          {/* Health */}
                          <div className="w-[60px] text-right font-mono text-xs">
                            <span className={cn("font-bold", getHealthColor(project.health))}>
                              {project.health}
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="w-[100px] space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-[var(--foreground-3)]">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  getProgressBg(project),
                                )}
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Delete */}
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleDeleteProject(project.id, project.name)}
                              className="p-1.5 hover:text-red text-[var(--foreground-3)] hover:bg-[var(--surface-2)] rounded transition-all"
                              title="Delete Project"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Project Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            {/* Backdrop Click Dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20"
              onClick={() => setShowModal(false)}
            />

            {/* Modal Dialog Form */}
            <motion.form
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onSubmit={handleCreateProject}
              className="relative z-10 w-full max-w-[480px] glass-panel rounded-2xl p-6 bg-[var(--surface-1)] border border-[var(--glass-border)] shadow-2xl space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                <h3 className="text-sm font-bold text-foreground">Create Project</h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-[var(--foreground-3)] hover:bg-[var(--surface-2)] hover:text-foreground transition-all"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Project Name */}
                <div className="space-y-1.5">
                  <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Core Refactor Q3"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground placeholder-[var(--foreground-3)] outline-none transition-colors focus:border-primary"
                  />
                </div>

                {/* Workspace Select */}
                <div className="space-y-1.5">
                  <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                    Workspace
                  </label>
                  <select
                    value={workspace}
                    onChange={(e) => setWorkspace(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="Engineering">⚙ Engineering</option>
                    <option value="Marketing">📣 Marketing</option>
                    <option value="Design">🎨 Design</option>
                    <option value="Operations">💼 Operations</option>
                    <option value="Finance">💵 Finance</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe the goals and scope of this project..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[70px] rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-3 text-sm text-foreground placeholder-[var(--foreground-3)] outline-none transition-colors focus:border-primary resize-none"
                  />
                </div>

                {/* Priority & Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </div>
                </div>

                {/* Lead Agent */}
                <div className="space-y-1.5">
                  <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                    Lead Agent
                  </label>
                  <select
                    value={leadAgent}
                    onChange={(e) => setLeadAgent(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="None">None</option>
                    <option value="Aria">Aria</option>
                    <option value="Nova">Nova</option>
                    <option value="Echo">Echo</option>
                    <option value="Flux">Flux</option>
                  </select>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--glass-border)]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" className="text-xs">
                  Create Project
                </Button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
