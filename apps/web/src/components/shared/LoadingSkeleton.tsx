"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  /** Predefined layout shape */
  variant?: "card" | "table-row" | "line" | "circle" | "chart"
  /** Number of skeleton items to render */
  count?: number
  className?: string
}

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-[var(--surface-2)]", className)} />
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Pulse className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Pulse className="h-3 w-2/3" />
          <Pulse className="h-2 w-1/3" />
        </div>
      </div>
      <Pulse className="h-16 w-full" />
      <div className="flex gap-2">
        <Pulse className="h-6 w-16 rounded-full" />
        <Pulse className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 border-b border-[var(--glass-border)] px-6 py-4">
      <Pulse className="size-8 rounded-full" />
      <Pulse className="h-3 flex-1" />
      <Pulse className="h-3 w-20" />
      <Pulse className="h-3 w-16" />
    </div>
  )
}

function SkeletonLine() {
  return <Pulse className="h-3 w-full" />
}

function SkeletonCircle() {
  return <Pulse className="size-10 rounded-full" />
}

function SkeletonChart() {
  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5 space-y-4">
      <Pulse className="h-4 w-1/3" />
      <Pulse className="h-48 w-full" />
    </div>
  )
}

const VARIANT_MAP: Record<string, React.FC> = {
  card: SkeletonCard,
  "table-row": SkeletonTableRow,
  line: SkeletonLine,
  circle: SkeletonCircle,
  chart: SkeletonChart,
}

export function LoadingSkeleton({ variant = "card", count = 1, className }: LoadingSkeletonProps) {
  const Component = VARIANT_MAP[variant]
  if (!Component) return null

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  )
}
