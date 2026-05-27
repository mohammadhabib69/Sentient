"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ListTodo,
  Activity,
  ArrowRight,
  Network,
  FileText,
  Bot,
  User,
  PlusCircle,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageTransition } from "@/components/shared/PageTransition";

// Spec and dynamic mock data
interface ProjectData {
  id: string;
  name: string;
  description: string;
  totalTasks: number;
  completedTasks: number;
  completedPercentage: string;
  blockedTasks: number;
  dueIn: string;
  health: {
    percentage: number | null;
    label: string;
    colorClass: string;
    textClass: string;
    strokeColor: string;
  };
  leadAgent: {
    name: string;
    role: string;
    status: string;
    avatar: string | null;
    initials: string;
    colorClass: string;
  } | null;
  members: Array<{
    name: string;
    role: string;
    avatarUrl: string | null;
    initials: string;
  }>;
  statusDistribution: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    blocked: number;
  };
  recentActivity: Array<{
    id: string;
    user: string;
    action: string;
    time: string;
    iconType: "assign" | "complete" | "block" | "comment" | "create";
  }>;
}

const PROJECT_MOCKS: Record<string, ProjectData> = {
  proj_1: {
    id: "proj_1",
    name: "Core Refactor Q3",
    description: "Refactor the core architecture to support new agent modules",
    totalTasks: 8,
    completedTasks: 5,
    completedPercentage: "62%",
    blockedTasks: 1,
    dueIn: "12 days",
    health: {
      percentage: 94,
      label: "Agent Flux monitoring",
      colorClass: "text-forest-green dark:text-emerald-400",
      textClass: "text-forest-green dark:text-emerald-400",
      strokeColor: "stroke-forest-green dark:stroke-emerald-500",
    },
    leadAgent: {
      name: "Flux",
      role: "Development Agent",
      status: "Active",
      avatar: null,
      initials: "FL",
      colorClass: "bg-emerald-500 text-white",
    },
    members: [
      {
        name: "Mohammad Habib",
        role: "Super Admin",
        avatarUrl: "/avatars/user.png",
        initials: "MH",
      },
      { name: "Sarah Jenkins", role: "Org Admin", avatarUrl: null, initials: "SJ" },
      { name: "Alex Patel", role: "Manager", avatarUrl: null, initials: "AP" },
    ],
    statusDistribution: {
      todo: 1,
      inProgress: 1,
      review: 1,
      done: 5,
      blocked: 1,
    },
    recentActivity: [
      {
        id: "act_1",
        user: "Flux",
        action: "assigned task to Sarah Jenkins",
        time: "2 hours ago",
        iconType: "assign",
      },
      {
        id: "act_2",
        user: "Sarah Jenkins",
        action: "completed task review for database migrations",
        time: "4 hours ago",
        iconType: "complete",
      },
      {
        id: "act_3",
        user: "Alex Patel",
        action: "marked task 'Fix Webhook delivery' as blocked",
        time: "1 day ago",
        iconType: "block",
      },
      {
        id: "act_4",
        user: "Flux",
        action: "created task 'Optimize Prisma queries'",
        time: "1 day ago",
        iconType: "create",
      },
      {
        id: "act_5",
        user: "Mohammad Habib",
        action: "commented on 'Design API schema'",
        time: "2 days ago",
        iconType: "comment",
      },
    ],
  },
  proj_2: {
    id: "proj_2",
    name: "Stripe API Migration",
    description: "Migrate payment processing to Stripe v3 API",
    totalTasks: 6,
    completedTasks: 2,
    completedPercentage: "33%",
    blockedTasks: 2,
    dueIn: "Overdue (5 days)",
    health: {
      percentage: 62,
      label: "Needs Attention",
      colorClass: "text-amber-500 dark:text-amber-400",
      textClass: "text-amber-500 dark:text-amber-400",
      strokeColor: "stroke-amber-500 dark:stroke-amber-400",
    },
    leadAgent: {
      name: "Nova",
      role: "Backend Agent",
      status: "Idle",
      avatar: null,
      initials: "NV",
      colorClass: "bg-amber-500 text-white",
    },
    members: [
      { name: "Sarah Jenkins", role: "Org Admin", avatarUrl: null, initials: "SJ" },
      { name: "Alex Patel", role: "Manager", avatarUrl: null, initials: "AP" },
    ],
    statusDistribution: {
      todo: 1,
      inProgress: 1,
      review: 0,
      done: 2,
      blocked: 2,
    },
    recentActivity: [
      {
        id: "act_1",
        user: "Nova",
        action: "flagged Stripe webhook route as blocked",
        time: "30 mins ago",
        iconType: "block",
      },
      {
        id: "act_2",
        user: "Sarah Jenkins",
        action: "completed 'Stripe SDK update'",
        time: "3 hours ago",
        iconType: "complete",
      },
      {
        id: "act_3",
        user: "Alex Patel",
        action: "assigned 'Audit payload structures' to Nova",
        time: "1 day ago",
        iconType: "assign",
      },
      {
        id: "act_4",
        user: "Nova",
        action: "created task 'SSL cert renewal'",
        time: "2 days ago",
        iconType: "create",
      },
      {
        id: "act_5",
        user: "Sarah Jenkins",
        action: "commented on 'Stripe API Migration'",
        time: "3 days ago",
        iconType: "comment",
      },
    ],
  },
  proj_3: {
    id: "proj_3",
    name: "Q4 Campaign",
    description: "GTM strategy, ad creatives, and tracking setup.",
    totalTasks: 10,
    completedTasks: 4,
    completedPercentage: "40%",
    blockedTasks: 0,
    dueIn: "30 days",
    health: {
      percentage: 88,
      label: "Agent Echo monitoring",
      colorClass: "text-forest-green dark:text-emerald-400",
      textClass: "text-forest-green dark:text-emerald-400",
      strokeColor: "stroke-forest-green dark:stroke-emerald-400",
    },
    leadAgent: {
      name: "Echo",
      role: "Marketing Agent",
      status: "Active",
      avatar: null,
      initials: "EC",
      colorClass: "bg-emerald-500 text-white",
    },
    members: [
      { name: "Chen Wei", role: "Frontend Developer", avatarUrl: null, initials: "CW" },
      { name: "Emily Ross", role: "Content Specialist", avatarUrl: null, initials: "ER" },
    ],
    statusDistribution: {
      todo: 3,
      inProgress: 2,
      review: 1,
      done: 4,
      blocked: 0,
    },
    recentActivity: [
      {
        id: "act_1",
        user: "Echo",
        action: "generated ad copy variations",
        time: "1 hour ago",
        iconType: "create",
      },
      {
        id: "act_2",
        user: "Emily Ross",
        action: "completed campaign outline",
        time: "5 hours ago",
        iconType: "complete",
      },
      {
        id: "act_3",
        user: "Chen Wei",
        action: "assigned 'Setup Pixel tracking' to Echo",
        time: "1 day ago",
        iconType: "assign",
      },
      {
        id: "act_4",
        user: "Echo",
        action: "completed tracking pixel validation",
        time: "1 day ago",
        iconType: "complete",
      },
      {
        id: "act_5",
        user: "Emily Ross",
        action: "commented on ad creatives feedback",
        time: "2 days ago",
        iconType: "comment",
      },
    ],
  },
  proj_4: {
    id: "proj_4",
    name: "Brand Refresh",
    description: "Revamp the visual identity and guidelines.",
    totalTasks: 5,
    completedTasks: 1,
    completedPercentage: "20%",
    blockedTasks: 0,
    dueIn: "45 days",
    health: {
      percentage: null,
      label: "No Agent Assigned",
      colorClass: "text-[var(--foreground-3)]",
      textClass: "text-[var(--foreground-3)]",
      strokeColor: "stroke-muted",
    },
    leadAgent: null,
    members: [
      { name: "Chen Wei", role: "Frontend Developer", avatarUrl: null, initials: "CW" },
      { name: "Emily Ross", role: "Content Specialist", avatarUrl: null, initials: "ER" },
    ],
    statusDistribution: {
      todo: 2,
      inProgress: 2,
      review: 0,
      done: 1,
      blocked: 0,
    },
    recentActivity: [
      {
        id: "act_1",
        user: "Emily Ross",
        action: "created task 'Finalize logo palette'",
        time: "4 hours ago",
        iconType: "create",
      },
      {
        id: "act_2",
        user: "Chen Wei",
        action: "completed 'Define brand voice'",
        time: "6 hours ago",
        iconType: "complete",
      },
      {
        id: "act_3",
        user: "Emily Ross",
        action: "assigned 'Create SVG assets' to Chen Wei",
        time: "1 day ago",
        iconType: "assign",
      },
      {
        id: "act_4",
        user: "Chen Wei",
        action: "commented on style guide draft",
        time: "2 days ago",
        iconType: "comment",
      },
      {
        id: "act_5",
        user: "Emily Ross",
        action: "started project setup",
        time: "3 days ago",
        iconType: "create",
      },
    ],
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectOverviewPage({ params }: PageProps) {
  const resolvedParams = React.use(params) as { id: string };
  const projectId = resolvedParams.id || "proj_1";
  const normalizedId = projectId.replace("-", "_");
  const project = (PROJECT_MOCKS[normalizedId] ?? PROJECT_MOCKS["proj_1"]) as ProjectData;

  const tabs = [
    { label: "Overview", href: `/projects/${projectId}` },
    { label: "Board", href: `/projects/${projectId}/board` },
    { label: "Timeline", href: "#" },
    { label: "Members", href: "#" },
  ];

  const handleExportReport = () => {
    toast.success("Preparing project report data...");
    setTimeout(() => {
      toast.success("Project report compiled and downloaded successfully!");
    }, 1500);
  };

  return (
    <PageTransition className="-mx-6 -my-6 flex flex-col bg-background relative min-h-[calc(100vh-56px)] overflow-y-auto select-none">
      {/* ── Sub Navigation Header Row ── */}
      <div className="border-b border-[var(--glass-border)] bg-background/50 backdrop-blur-md px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        {/* Breadcrumb & Tabs */}
        <div className="space-y-2">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-3)] font-mono">
            <Link href="/projects" className="hover:text-foreground transition-colors">
              Projects
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-[var(--foreground-2)] font-semibold">{project.name}</span>
          </div>

          {/* Sub Nav Tabs */}
          <nav className="flex gap-4">
            {tabs.map((tab) => {
              const isOverviewActive = tab.label === "Overview";
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    "text-xs font-semibold py-1 border-b-2 transition-all",
                    isOverviewActive
                      ? "border-primary text-primary"
                      : "border-transparent text-[var(--foreground-2)] hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success("AI Agent dispatched to analyze project board...")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-dashed border-[var(--glass-border)] hover:bg-[var(--surface-2)] text-[var(--foreground-2)] hover:text-foreground transition-all"
          >
            <span>Ask AI</span>
            <Sparkles className="size-3 text-primary animate-pulse" />
          </button>

          <Link href={`/projects/${projectId}/board`}>
            <Button size="sm" className="flex items-center gap-1.5 shadow-sm">
              Open Board
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Overview Main Content Area ── */}
      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top stats row (4 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Tasks */}
          <div className="glass-panel rounded-xl p-5 border border-[var(--glass-border)] flex items-center justify-between shadow-[var(--shadow-card)] transition-all hover:scale-[1.01]">
            <div className="space-y-1">
              <span className="text-xs font-mono text-[var(--foreground-3)] uppercase tracking-wider">
                Total Tasks
              </span>
              <h3 className="text-3xl font-bold tracking-tight text-foreground">
                {project.totalTasks}
              </h3>
              <p className="text-[11px] text-[var(--foreground-3)]">Items in active backlog</p>
            </div>
            <div className="size-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-primary">
              <ListTodo className="size-5" />
            </div>
          </div>

          {/* Card 2: Completed */}
          <div className="glass-panel rounded-xl p-5 border border-[var(--glass-border)] flex items-center justify-between shadow-[var(--shadow-card)] transition-all hover:scale-[1.01]">
            <div className="space-y-1">
              <span className="text-xs font-mono text-[var(--foreground-3)] uppercase tracking-wider">
                Completed
              </span>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  {project.completedTasks}
                </h3>
                <span className="text-xs font-semibold text-forest-green dark:text-emerald-400">
                  ({project.completedPercentage})
                </span>
              </div>
              <p className="text-[11px] text-[var(--foreground-3)]">Successfully closed items</p>
            </div>
            <div className="size-10 rounded-lg bg-forest-green/10 flex items-center justify-center text-forest-green dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
          </div>

          {/* Card 3: Blocked */}
          <div className="glass-panel rounded-xl p-5 border border-[var(--glass-border)] flex items-center justify-between shadow-[var(--shadow-card)] transition-all hover:scale-[1.01]">
            <div className="space-y-1">
              <span className="text-xs font-mono text-[var(--foreground-3)] uppercase tracking-wider">
                Blocked
              </span>
              <h3
                className={cn(
                  "text-3xl font-bold tracking-tight",
                  project.blockedTasks > 0 ? "text-red-500" : "text-foreground",
                )}
              >
                {project.blockedTasks}
              </h3>
              <p className="text-[11px] text-[var(--foreground-3)]">
                {project.blockedTasks > 0 ? "Requires immediate review" : "No blockers identified"}
              </p>
            </div>
            <div
              className={cn(
                "size-10 rounded-lg flex items-center justify-center transition-colors",
                project.blockedTasks > 0
                  ? "bg-red-500/10 text-red-500"
                  : "bg-[var(--surface-2)] text-[var(--foreground-3)]",
              )}
            >
              <AlertCircle className="size-5" />
            </div>
          </div>

          {/* Card 4: Due in */}
          <div className="glass-panel rounded-xl p-5 border border-[var(--glass-border)] flex items-center justify-between shadow-[var(--shadow-card)] transition-all hover:scale-[1.01]">
            <div className="space-y-1">
              <span className="text-xs font-mono text-[var(--foreground-3)] uppercase tracking-wider">
                Due in
              </span>
              <h3 className="text-3xl font-bold tracking-tight text-foreground">{project.dueIn}</h3>
              <p className="text-[11px] text-[var(--foreground-3)]">Target timeline window</p>
            </div>
            <div className="size-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--foreground-2)]">
              <Clock className="size-5" />
            </div>
          </div>
        </div>

        {/* Two Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column (60% / 6 spans out of 10) */}
          <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
            {/* Recent Activity card */}
            <div className="glass-panel rounded-xl border border-[var(--glass-border)] p-6 space-y-4 shadow-[var(--shadow-card)] flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="size-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
                </div>

                <div className="space-y-5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-[var(--glass-border)]">
                  {project.recentActivity.map((act) => {
                    let Icon = Activity;
                    let iconBg = "bg-[var(--surface-2)] text-[var(--foreground-2)]";

                    if (act.iconType === "assign") {
                      Icon = User;
                      iconBg = "bg-primary/10 text-primary";
                    } else if (act.iconType === "complete") {
                      Icon = CheckCircle2;
                      iconBg = "bg-forest-green/10 text-forest-green dark:text-emerald-400";
                    } else if (act.iconType === "block") {
                      Icon = AlertCircle;
                      iconBg = "bg-red-500/10 text-red-500";
                    } else if (act.iconType === "create") {
                      Icon = PlusCircle;
                      iconBg = "bg-blue-500/10 text-blue-500";
                    } else if (act.iconType === "comment") {
                      Icon = MessageSquare;
                      iconBg = "bg-purple-500/10 text-purple-500";
                    }

                    return (
                      <div key={act.id} className="flex gap-4 items-start relative z-10">
                        <div
                          className={cn(
                            "size-6 rounded-full flex items-center justify-center border border-[var(--glass-border)] shadow-sm shrink-0",
                            iconBg,
                          )}
                        >
                          <Icon className="size-3" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs text-[var(--foreground-2)] leading-relaxed">
                            <span className="font-semibold text-foreground">{act.user}</span>{" "}
                            {act.action}
                          </p>
                          <span className="text-[10px] text-[var(--foreground-3)] font-mono block">
                            {act.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Task Status Distribution Card */}
            <div className="glass-panel rounded-xl border border-[var(--glass-border)] p-6 space-y-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="size-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Task Status Distribution
                  </h4>
                </div>
                <span className="text-xs font-mono text-[var(--foreground-3)]">
                  Total: {project.totalTasks} tasks
                </span>
              </div>

              {/* Horizontal Stacked Bar */}
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-[var(--surface-3)] border border-[var(--glass-border)] shadow-inner">
                {project.statusDistribution.done > 0 && (
                  <div
                    style={{
                      width: `${(project.statusDistribution.done / project.totalTasks) * 100}%`,
                    }}
                    className="h-full bg-forest-green dark:bg-emerald-600 hover:opacity-90 transition-all cursor-help"
                    title={`Done: ${project.statusDistribution.done}`}
                  />
                )}
                {project.statusDistribution.inProgress > 0 && (
                  <div
                    style={{
                      width: `${(project.statusDistribution.inProgress / project.totalTasks) * 100}%`,
                    }}
                    className="h-full bg-primary hover:opacity-90 transition-all cursor-help"
                    title={`In Progress: ${project.statusDistribution.inProgress}`}
                  />
                )}
                {project.statusDistribution.review > 0 && (
                  <div
                    style={{
                      width: `${(project.statusDistribution.review / project.totalTasks) * 100}%`,
                    }}
                    className="h-full bg-purple-500 hover:opacity-90 transition-all cursor-help"
                    title={`Review: ${project.statusDistribution.review}`}
                  />
                )}
                {project.statusDistribution.todo > 0 && (
                  <div
                    style={{
                      width: `${(project.statusDistribution.todo / project.totalTasks) * 100}%`,
                    }}
                    className="h-full bg-neutral-400 dark:bg-neutral-600 hover:opacity-90 transition-all cursor-help"
                    title={`Todo: ${project.statusDistribution.todo}`}
                  />
                )}
                {project.statusDistribution.blocked > 0 && (
                  <div
                    style={{
                      width: `${(project.statusDistribution.blocked / project.totalTasks) * 100}%`,
                    }}
                    className="h-full bg-red-500 hover:opacity-90 transition-all cursor-help"
                    title={`Blocked: ${project.statusDistribution.blocked}`}
                  />
                )}
              </div>

              {/* Distribution Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-2)]">
                    <span className="size-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                    <span>Todo</span>
                  </div>
                  <p className="text-xs font-semibold pl-3.5 text-foreground">
                    {project.statusDistribution.todo}{" "}
                    <span className="text-[10px] text-[var(--foreground-3)]">
                      ({Math.round((project.statusDistribution.todo / project.totalTasks) * 100)}%)
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-2)]">
                    <span className="size-2 rounded-full bg-primary" />
                    <span>In Progress</span>
                  </div>
                  <p className="text-xs font-semibold pl-3.5 text-foreground">
                    {project.statusDistribution.inProgress}{" "}
                    <span className="text-[10px] text-[var(--foreground-3)]">
                      (
                      {Math.round(
                        (project.statusDistribution.inProgress / project.totalTasks) * 100,
                      )}
                      %)
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-2)]">
                    <span className="size-2 rounded-full bg-purple-500" />
                    <span>Review</span>
                  </div>
                  <p className="text-xs font-semibold pl-3.5 text-foreground">
                    {project.statusDistribution.review}{" "}
                    <span className="text-[10px] text-[var(--foreground-3)]">
                      ({Math.round((project.statusDistribution.review / project.totalTasks) * 100)}
                      %)
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-2)]">
                    <span className="size-2 rounded-full bg-forest-green dark:bg-emerald-600" />
                    <span>Done</span>
                  </div>
                  <p className="text-xs font-semibold pl-3.5 text-foreground">
                    {project.statusDistribution.done}{" "}
                    <span className="text-[10px] text-[var(--foreground-3)]">
                      ({Math.round((project.statusDistribution.done / project.totalTasks) * 100)}%)
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-2)]">
                    <span className="size-2 rounded-full bg-red-500" />
                    <span>Blocked</span>
                  </div>
                  <p className="text-xs font-semibold pl-3.5 text-foreground">
                    {project.statusDistribution.blocked}{" "}
                    <span className="text-[10px] text-[var(--foreground-3)]">
                      ({Math.round((project.statusDistribution.blocked / project.totalTasks) * 100)}
                      %)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (40% / 4 spans out of 10) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Project Health Card */}
            <div className="glass-panel rounded-xl border border-[var(--glass-border)] p-6 shadow-[var(--shadow-card)] flex flex-col items-center justify-center text-center">
              <span className="text-xs font-mono text-[var(--foreground-3)] uppercase tracking-wider mb-4">
                Project Health
              </span>

              <div className="relative size-32 flex items-center justify-center my-1">
                {/* SVG Gauge */}
                <svg className="size-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    className="stroke-muted fill-none"
                    strokeWidth="8"
                  />
                  {project.health.percentage !== null ? (
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      className={cn(
                        "fill-none transition-all duration-1000",
                        project.health.strokeColor,
                      )}
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - project.health.percentage / 100)}
                      strokeLinecap="round"
                    />
                  ) : null}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {project.health.percentage !== null ? `${project.health.percentage}%` : "—"}
                  </span>
                  {project.health.percentage !== null && (
                    <span className="text-[10px] uppercase font-bold text-forest-green dark:text-emerald-400 tracking-wider">
                      Healthy
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--foreground-2)] bg-[var(--surface-2)] px-3 py-1 rounded-full border border-[var(--glass-border)] shadow-sm">
                {project.health.percentage !== null && <Bot className="size-3.5 text-primary" />}
                <span>{project.health.label}</span>
              </div>
            </div>

            {/* Team Members Card */}
            <div className="glass-panel rounded-xl border border-[var(--glass-border)] p-6 space-y-4 shadow-[var(--shadow-card)]">
              <h4 className="text-sm font-semibold text-foreground">Team Members</h4>
              <div className="divide-y divide-[var(--glass-border)]">
                {project.members.map((member, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between py-3",
                      i === 0 ? "pt-0" : "",
                      i === project.members.length - 1 ? "pb-0" : "",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {member.avatarUrl && (
                          <AvatarImage src={member.avatarUrl} alt={member.name} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{member.name}</p>
                        <p className="text-[10px] text-[var(--foreground-3)]">{member.role}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-[var(--foreground-3)] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--glass-border)]">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Agent Card */}
            <div className="glass-panel rounded-xl border border-[var(--glass-border)] p-6 space-y-4 shadow-[var(--shadow-card)] bg-primary/[0.02]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--foreground-3)] uppercase tracking-wider">
                  Lead Agent
                </span>
                {project.leadAgent && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    <Zap className="size-2.5 text-primary animate-pulse" />
                    Autonomous
                  </span>
                )}
              </div>

              {project.leadAgent ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <Bot className="size-5 text-primary" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-foreground">
                          {project.leadAgent.name}
                        </h5>
                        <p className="text-[10px] text-[var(--foreground-3)]">
                          {project.leadAgent.role}
                        </p>
                      </div>
                    </div>

                    {/* Pulsing Status Dot */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 rounded-full status-pulse",
                          project.leadAgent.colorClass,
                        )}
                      />
                      <span className="text-[10px] font-mono text-[var(--foreground-2)]">
                        {project.leadAgent.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--foreground-2)] leading-relaxed">
                    Continuously checks board task status, resolves dependency blocks, and reports
                    health diagnostics to the workspace.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <Bot className="size-8 mx-auto text-[var(--foreground-3)]" />
                  <p className="text-xs text-[var(--foreground-2)] font-medium">
                    No Lead Agent Assigned
                  </p>
                  <p className="text-[10px] text-[var(--foreground-3)]">
                    Assign an agent in project settings to enable automation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions (bottom row) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 glass-panel rounded-xl border border-[var(--glass-border)] shadow-[var(--shadow-card)] bg-[var(--surface-1)]">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="text-xs font-semibold text-foreground">Quick Workflow Transitions</p>
            <p className="text-[10px] text-[var(--foreground-3)]">
              Access taskboards, interactive graphs, or report summaries.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 border border-[var(--glass-border)] bg-background/50 hover:bg-[var(--surface-2)] text-[var(--foreground-2)] hover:text-foreground"
              onClick={handleExportReport}
            >
              <FileText className="size-3.5" />
              <span>Export Report</span>
            </Button>

            <Link href="/graph">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 border border-[var(--glass-border)] bg-background/50 hover:bg-[var(--surface-2)] text-[var(--foreground-2)] hover:text-foreground"
              >
                <Network className="size-3.5" />
                <span>View on Graph</span>
              </Button>
            </Link>

            <Link href={`/projects/${projectId}/board`}>
              <Button variant="default" size="sm" className="flex items-center gap-1.5">
                <span>Open Board</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
