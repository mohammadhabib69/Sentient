"use client";

import * as React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Task } from "@/types/task.types";
import { Bot, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  // Spec Colors for Left Border (Priority):
  // red=critical, amber=high, teal=medium, muted=low
  const priorityBorderColors = {
    low: "border-l-[var(--foreground-3)]",
    medium: "border-l-primary",
    high: "border-l-amber",
    critical: "border-l-red",
  };

  const priorityBadges = {
    low: "text-[var(--foreground-3)] bg-[var(--surface-3)]",
    medium: "text-primary bg-primary/10",
    high: "text-amber bg-amber/10",
    critical: "text-red bg-red/10",
  };

  // Check if AI assigned
  const isAria =
    (task.agentAssigned && task.title.toLowerCase().includes("ops")) || index % 4 === 0;
  const isFlux = task.agentAssigned && !isAria;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => {
        // Rotate 2 degrees on drag state
        const style = {
          ...provided.draggableProps.style,
          transform: snapshot.isDragging
            ? `${provided.draggableProps.style?.transform} rotate(2deg)`
            : provided.draggableProps.style?.transform,
        };

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => onClick(task)}
            style={style}
            className={cn(
              "select-none cursor-grab active:cursor-grabbing mb-2 rounded-[10px] border border-l-[3px] bg-[var(--surface-1)] border-[var(--border)] p-3 flex flex-col gap-2.5 transition-all duration-200 hover:brightness-105",
              priorityBorderColors[task.priority],
              snapshot.isDragging &&
                "scale-[1.02] bg-[rgba(44,61,51,0.80)] border-primary/40 border-l-[3px] shadow-[0_16px_40px_rgba(0,0,0,0.50)] backdrop-blur-[8px] z-50 ring-2 ring-primary/30",
            )}
          >
            {/* Header row: Priority Badge & Label Tag */}
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider",
                  priorityBadges[task.priority],
                )}
              >
                {task.priority}
              </span>
              <span className="text-[10px] font-mono text-[var(--foreground-3)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--glass-border)]">
                {index % 2 === 0 ? "Backend" : "Auth"}
              </span>
            </div>

            {/* Title (max 2 lines) */}
            <h4 className="text-sm font-medium leading-snug text-foreground line-clamp-2">
              {task.title}
            </h4>

            {/* Bottom Row */}
            <div className="flex items-center justify-between pt-1">
              {/* Agent Active / User Assignee Indicator */}
              {task.agentAssigned ? (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-primary font-mono bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
                  <Bot className="size-3" />
                  <span>{isAria ? "🤖 Aria" : "🤖 Flux"}</span>
                </div>
              ) : task.assignee ? (
                <div className="flex items-center gap-1.5">
                  <div className="size-5 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[9px] font-bold text-foreground border border-[var(--glass-border)]">
                    {task.assignee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <span className="text-[10px] text-[var(--foreground-3)] font-mono truncate max-w-[80px]">
                    {task.assignee.name.split(" ")[0]}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-[var(--foreground-3)] font-mono">Unassigned</span>
              )}

              {/* Due Date & Subtasks count */}
              <div className="flex items-center gap-2.5 text-[10px] font-mono text-[var(--foreground-3)]">
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(task.dueDate).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                {index % 3 === 0 && (
                  <span className="flex items-center gap-0.5">
                    <Layers className="size-3" />
                    3/8
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </Draggable>
  );
}
