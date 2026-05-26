"use client"

import * as React from "react"
import { Droppable } from "@hello-pangea/dnd"
import { Task } from "@/types/task.types"
import { TaskCard } from "./TaskCard"
import { MoreHorizontal, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  id: string
  title: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  const isBlocked = id === 'blocked'

  return (
    <div className={cn(
      "flex h-full w-[300px] shrink-0 flex-col rounded-xl border bg-[var(--surface-1)] shadow-sm",
      isBlocked ? "border-[var(--red)]/30 bg-[var(--red)]/[0.02]" : "border-[var(--glass-border)]"
    )}>
      {/* Column Header */}
      <div className={cn(
        "flex items-center justify-between border-b px-4 py-3",
        isBlocked ? "border-[var(--red)]/20" : "border-[var(--glass-border)]"
      )}>
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-semibold",
            isBlocked ? "text-[var(--red)]" : "text-foreground"
          )}>
            {title}
          </h3>
          <span className="flex size-5 items-center justify-center rounded-full bg-[var(--surface-3)] text-xs font-medium text-[var(--foreground-2)]">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 text-[var(--foreground-3)] hover:bg-[var(--surface-2)] hover:text-foreground transition-colors">
            <Plus className="size-4" />
          </button>
          <button className="rounded p-1 text-[var(--foreground-3)] hover:bg-[var(--surface-2)] hover:text-foreground transition-colors">
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto p-3 scrollbar-hide transition-colors",
              snapshot.isDraggingOver ? "bg-[var(--surface-2)]/50" : ""
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
