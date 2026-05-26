"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useTasks } from "@/hooks/useTasks"
import { useTaskStore } from "@/store/task.store"
import { KanbanBoard } from "@/components/projects/KanbanBoard"
import { TaskDetailPanel } from "@/components/projects/TaskDetailPanel"
import { MOCK_TASKS } from "@/mocks/fixtures/tasks.fixture"
import { Task } from "@/types/task.types"
import { PageTransition } from "@/components/shared/PageTransition"
import { FolderKanban, Users, Share2, Filter } from "lucide-react"

export default function ProjectBoardPage() {
  const params = useParams()
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

  return (
    <PageTransition className="flex h-full flex-col">
      
      {/* Board Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <FolderKanban className="size-6 text-[hsl(var(--secondary))]" />
            Project Board
          </h1>
          <p className="text-sm text-[var(--foreground-2)] mt-1">
            Q3 Feature Release (Project ID: {projectId})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-2">
            <div className="size-8 rounded-full border-2 border-[var(--surface-1)] bg-[var(--surface-3)]" />
            <div className="size-8 rounded-full border-2 border-[var(--surface-1)] bg-[hsl(var(--primary))]" />
            <div className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--surface-1)] bg-[var(--surface-2)] text-xs font-medium text-foreground">
              +4
            </div>
          </div>
          
          <button className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-1)] px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-[var(--surface-2)]">
            <Filter className="size-4 text-[var(--foreground-3)]" />
            Filter
          </button>
          
          <button className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[hsl(var(--primary))]/90">
            <Share2 className="size-4" />
            Share
          </button>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-full w-[300px] shrink-0 animate-pulse rounded-xl bg-[var(--surface-2)]" />
            ))}
          </div>
        ) : (
          <KanbanBoard onTaskClick={setSelectedTask} />
        )}
      </div>

      <TaskDetailPanel 
        task={selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </PageTransition>
  )
}
