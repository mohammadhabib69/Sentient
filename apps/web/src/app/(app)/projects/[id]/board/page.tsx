"use client"

import * as React from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import { useTasks } from "@/hooks/useTasks"
import { useTaskStore } from "@/store/task.store"
import { KanbanBoard } from "@/components/projects/KanbanBoard"
import { TaskDetailPanel } from "@/components/projects/TaskDetailPanel"
import { Task } from "@/types/task.types"
import { PageTransition } from "@/components/shared/PageTransition"
import { Sparkles, Plus, SlidersHorizontal, Settings, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function ProjectBoardPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const projectId = typeof params.id === 'string' ? params.id : 'proj_1'
  
  const { data: serverTasks = [], isLoading } = useTasks(projectId)
  const { tasks, setTasks } = useTaskStore()
  
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)

  // Sync server data to Zustand store on initial load
  React.useEffect(() => {
    if (serverTasks.length > 0 && tasks.length === 0) {
      setTasks(serverTasks)
    }
  }, [serverTasks, setTasks])

  const tabs = [
    { label: "Overview", href: `/projects/${projectId}` },
    { label: "Board", href: `/projects/${projectId}/board` },
    { label: "Timeline", href: "#" },
    { label: "Members", href: "#" }
  ]

  return (
    <PageTransition className="-mx-6 -my-6 flex h-[calc(100vh-56px)] flex-col bg-background relative overflow-hidden select-none">
      
      {/* ── Sub Navigation Header Row ── */}
      <div className="border-b border-[var(--glass-border)] bg-background/50 backdrop-blur-md px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        
        {/* Breadcrumb & Tabs */}
        <div className="space-y-2">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-3)] font-mono">
            <Link href="/projects" className="hover:text-foreground">Projects</Link>
            <ChevronRight className="size-3" />
            <span className="text-[var(--foreground-2)] font-semibold">Core Refactor Q3</span>
          </div>

          {/* Sub Nav Tabs */}
          <nav className="flex gap-4">
            {tabs.map((tab) => {
              const isBoardActive = tab.label === "Board"
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    "text-xs font-semibold py-1 border-b-2 transition-all",
                    isBoardActive 
                      ? "border-primary text-primary" 
                      : "border-transparent text-[var(--foreground-2)] hover:text-foreground"
                  )}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-dashed border-[var(--glass-border)] hover:bg-[var(--surface-2)] text-[var(--foreground-2)] hover:text-foreground transition-all">
            <span>Ask AI</span>
            <Sparkles className="size-3 text-primary animate-pulse" />
          </button>
          
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary hover:brightness-110 text-white shadow-sm transition-all">
            <Plus className="size-3.5" />
            Add Task
          </button>

          <div className="w-px h-5 bg-[var(--glass-border)] mx-1" />

          <button className="p-2 text-[var(--foreground-3)] hover:text-foreground hover:bg-[var(--surface-2)] rounded-lg transition-all">
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

      </div>

      {/* ── Horizontal Scrollable Board Area (Full Bleed) ── */}
      <div className="flex-1 overflow-x-auto px-6 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/10">
        {isLoading ? (
          <div className="flex h-full gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-full w-[280px] shrink-0 animate-pulse rounded-xl bg-[var(--surface-2)]" />
            ))}
          </div>
        ) : (
          <KanbanBoard onTaskClick={setSelectedTask} />
        )}
      </div>

      {/* Detail Slide panel */}
      <TaskDetailPanel 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />

    </PageTransition>
  )
}
