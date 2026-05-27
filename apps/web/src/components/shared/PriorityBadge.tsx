"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high" | "critical";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className:
      "bg-[var(--foreground-3)]/10 text-[var(--foreground-3)] border-[var(--foreground-3)]/20",
  },
  medium: {
    label: "Medium",
    className:
      "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/20",
  },
  high: {
    label: "High",
    className: "bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/20",
  },
  critical: {
    label: "Critical",
    className: "bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/20",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
