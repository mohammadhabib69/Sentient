"use client";

import * as React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Task } from "@/types/task.types";
import { TaskCard } from "./TaskCard";
import { Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  const isBlocked = id === "blocked";

  // Specific dot colors per column status:
  const statusDots: Record<string, string> = {
    todo: "bg-[var(--foreground-3)]",
    in_progress: "bg-primary",
    review: "bg-amber",
    done: "bg-forest-green",
    blocked: "bg-red",
  };

  return (
    <div
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col gap-2 rounded-xl border border-[var(--border)] bg-transparent select-none",
        isBlocked
          ? "border-t-[3px] border-t-[rgba(192,80,74,0.5)] border-x-[var(--border)] border-b-[var(--border)] bg-red/5"
          : "",
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Status Indicator Dot */}
          <span className={cn("size-2 rounded-full", statusDots[id] || "bg-foreground")} />
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <span className="font-mono text-[10px] bg-[var(--surface-2)] text-[var(--foreground-3)] px-1.5 py-0.5 rounded border border-[var(--glass-border)]">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-1 text-[var(--foreground-3)] hover:text-foreground hover:bg-[var(--surface-2)] rounded transition-colors">
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Droppable Area Dropzone */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto px-2 pb-2 rounded-lg transition-colors min-h-[300px]",
              // snapshot.isDraggingOver ? "bg-primary/5 border border-dashed border-primary" : "bg-[rgba(37,40,39,0.40)] dark:bg-[rgba(37,40,39,0.40)] light:bg-[rgba(240,244,242,0.80)]"
              snapshot.isDraggingOver
                ? "bg-primary/5 border border-dashed border-primary/20"
                : "bg-[rgba(37,40,39,0.60)] dark:bg-[rgba(37,40,39,0.60)] light:bg-[rgba(240,244,242,0.80)]",
            )}
          >
            <div className="space-y-1 pt-2">
              {tasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} onClick={onTaskClick} />
              ))}
            </div>
            {provided.placeholder}

            {/* Add task ghost row */}
            <button className="w-full mt-2 py-2 border border-dashed border-[var(--glass-border)] rounded-[10px] text-xs font-mono text-[var(--foreground-3)] hover:text-foreground hover:bg-[var(--surface-2)] transition-all flex items-center justify-center gap-1">
              <Plus className="size-3" /> Add a task
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}
