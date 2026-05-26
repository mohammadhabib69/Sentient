"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { TaskStatus } from "@/types/task.types"

interface StatusBadgeProps {
  status: TaskStatus
  className?: string
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: "To Do",
    className: "bg-[var(--surface-3)] text-[var(--foreground-2)] border-[var(--glass-border)]",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/20",
  },
  review: {
    label: "Review",
    className: "bg-[hsl(var(--secondary))]/10 text-[hsl(var(--secondary))] border-[hsl(var(--secondary))]/20",
  },
  done: {
    label: "Done",
    className: "bg-green/10 text-green border-green/20",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red/10 text-red border-red/20",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
