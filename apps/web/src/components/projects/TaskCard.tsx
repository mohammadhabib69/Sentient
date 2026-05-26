"use client"

import * as React from "react"
import { Draggable } from "@hello-pangea/dnd"
import { Task } from "@/types/task.types"
import { Bot, AlertCircle, Clock } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  index: number
  onClick: (task: Task) => void
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priorityColors = {
    low: "border-l-[var(--foreground-3)]",
    medium: "border-l-[hsl(var(--primary))]",
    high: "border-l-[var(--amber)]",
    critical: "border-l-[var(--red)]",
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={cn(
            "mb-3 flex cursor-grab flex-col gap-3 rounded-lg border border-l-4 bg-[var(--surface-1)] p-3 shadow-sm transition-all hover:bg-[var(--surface-2)] active:cursor-grabbing",
            priorityColors[task.priority],
            snapshot.isDragging && "scale-[1.02] bg-[var(--glass-bg)] shadow-lg backdrop-blur-md ring-2 ring-[hsl(var(--primary))]/50 z-50",
            task.status === "blocked" && !snapshot.isDragging && "bg-[var(--red)]/5"
          )}
          style={{ ...provided.draggableProps.style }}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight text-foreground line-clamp-2">
              {task.title}
            </h4>
          </div>

          {task.description && (
            <p className="line-clamp-2 text-xs text-[var(--foreground-3)]">
              {task.description}
            </p>
          )}

          <div className="mt-1 flex items-center justify-between">
            {/* AI Assigned Indicator */}
            {task.agentAssigned ? (
              <div className="flex items-center gap-1.5 rounded bg-[hsl(var(--secondary))]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--secondary))] border border-[hsl(var(--secondary))]/20">
                <Bot className="size-3" />
                Agent Active
              </div>
            ) : task.dueDate ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground-3)]">
                <Clock className="size-3.5" />
                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            ) : (
              <div />
            )}

            {/* Assignee Avatar */}
            {task.assignee && (
              <Avatar className="size-6 border border-[var(--glass-border)]">
                {task.assignee.avatarUrl && <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />}
                <AvatarFallback className="bg-[hsl(var(--primary))]/10 text-[10px] font-medium text-[hsl(var(--primary))]">
                  {task.assignee.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
