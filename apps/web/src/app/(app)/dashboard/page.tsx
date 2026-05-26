"use client"

import { useTasks } from "@/hooks/useTasks"
import { usePendingActions } from "@/hooks/useAgents"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { AgentStatusGrid } from "@/components/dashboard/AgentStatusGrid"
import { ProjectsOverview } from "@/components/dashboard/ProjectsOverview"
import { RealityStreamFeed } from "@/components/dashboard/RealityStreamFeed"
import { TopologyMiniGraph } from "@/components/dashboard/TopologyMiniGraph"
import { CheckCircle2, ShieldAlert, Activity, HeartPulse, Search } from "lucide-react"
import { PageTransition } from "@/components/shared/PageTransition"

export default function DashboardPage() {
  const { data: tasks = [] } = useTasks()
  const { data: pendingActions = [] } = usePendingActions()

  const activeTasksCount = tasks.filter(t => t.status === 'in_progress').length
  const pendingCount = pendingActions.length

  return (
    <PageTransition className="flex h-full flex-col gap-6 relative pb-20">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-sm text-[var(--foreground-2)]">Monitor your autonomous agents and ongoing operations.</p>
      </div>

      {/* ── Top Row: Metrics ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Tasks"
          value={activeTasksCount}
          subtext="across all projects"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Pending Approvals"
          value={pendingCount}
          subtext={pendingCount > 0 ? "Requires attention" : "All clear"}
          icon={ShieldAlert}
          amberTint={pendingCount > 0}
        />
        <MetricCard
          title="Agent Actions"
          value="10.7k"
          subtext="+12% from yesterday"
          icon={Activity}
        />
        <MetricCard
          title="System Health"
          value="99.9%"
          subtext="Operational"
          icon={HeartPulse}
        />
      </div>

      {/* ── Middle Row: Projects & Agents ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectsOverview />
        </div>
        <div className="lg:col-span-1">
          <AgentStatusGrid />
        </div>
      </div>

      {/* ── Bottom Row: Stream & Graph ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 h-[340px]">
          <RealityStreamFeed />
        </div>
        <div className="lg:col-span-2 h-[340px]">
          <TopologyMiniGraph />
        </div>
      </div>

      {/* ── Command Input Bar (Fixed Bottom) ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40 pointer-events-none">
        <div className="pointer-events-auto flex items-center rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 shadow-[var(--shadow-float)] backdrop-blur-2xl">
          <Search className="mr-3 size-5 text-[var(--foreground-3)]" />
          <input 
            type="text" 
            placeholder="Ask Sentient to analyze data, run a task, or update settings..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-[var(--foreground-3)]"
          />
          <kbd className="hidden rounded border border-[var(--glass-border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--foreground-2)] sm:block">
            ↵ Enter
          </kbd>
        </div>
      </div>
    </PageTransition>
  )
}
