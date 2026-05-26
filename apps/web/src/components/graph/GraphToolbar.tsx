"use client"

import * as React from "react"
import { ZoomIn, ZoomOut, Maximize, Filter, Star, CornerUpRight, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface GraphToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onToggleBottlenecks: () => void
  onToggleCriticalPath: () => void
  onExport: () => void
}

export function GraphToolbar({
  onZoomIn,
  onZoomOut,
  onFit,
  onToggleBottlenecks,
  onToggleCriticalPath,
  onExport,
}: GraphToolbarProps) {
  const [bottlenecksActive, setBottlenecksActive] = React.useState(false)
  const [criticalPathActive, setCriticalPathActive] = React.useState(false)

  const handleToggleBottlenecks = () => {
    setBottlenecksActive(!bottlenecksActive)
    onToggleBottlenecks()
  }

  const handleToggleCriticalPath = () => {
    setCriticalPathActive(!criticalPathActive)
    onToggleCriticalPath()
  }

  return (
    <div className="absolute top-6 right-6 flex items-center gap-1 rounded-xl border border-[var(--glass-border)] bg-[rgba(44,61,51,0.85)] p-2 shadow-[var(--shadow-float)] backdrop-blur-xl z-30">
      
      {/* Zoom controls */}
      <button 
        onClick={onZoomIn} 
        className="rounded-lg p-2 text-[var(--foreground-2)] hover:bg-[var(--surface-3)] hover:text-foreground transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="size-4" />
      </button>
      <button 
        onClick={onZoomOut} 
        className="rounded-lg p-2 text-[var(--foreground-2)] hover:bg-[var(--surface-3)] hover:text-foreground transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="size-4" />
      </button>
      <button 
        onClick={onFit} 
        className="rounded-lg p-2 text-[var(--foreground-2)] hover:bg-[var(--surface-3)] hover:text-foreground transition-colors"
        title="Fit to Screen"
      >
        <Maximize className="size-4" />
      </button>

      <div className="w-px h-4 bg-[var(--glass-border)] mx-1" />

      {/* Toggle filters */}
      <button 
        className="rounded-lg p-2 text-[var(--foreground-2)] hover:bg-[var(--surface-3)] hover:text-foreground transition-colors"
        title="Filter by Type"
      >
        <Filter className="size-4" />
      </button>

      {/* Bottlenecks toggle */}
      <button 
        onClick={handleToggleBottlenecks}
        className={cn(
          "rounded-lg p-2 transition-colors",
          bottlenecksActive 
            ? "bg-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)]/30" 
            : "text-[var(--foreground-2)] hover:bg-[var(--surface-3)] hover:text-foreground"
        )}
        title="Highlight Bottlenecks"
      >
        <Star className="size-4 fill-current" />
      </button>

      {/* Critical Path toggle */}
      <button 
        onClick={handleToggleCriticalPath}
        className={cn(
          "rounded-lg p-2 transition-colors",
          criticalPathActive 
            ? "bg-primary/20 text-primary hover:bg-primary/30" 
            : "text-[var(--foreground-2)] hover:bg-[var(--surface-3)] hover:text-foreground"
        )}
        title="Highlight Critical Path"
      >
        <CornerUpRight className="size-4" />
      </button>

      <div className="w-px h-4 bg-[var(--glass-border)] mx-1" />

      {/* Export */}
      <button 
        onClick={onExport} 
        className="rounded-lg p-2 text-[var(--foreground-2)] hover:bg-[var(--surface-3)] hover:text-foreground transition-colors"
        title="Export Diagram"
      >
        <Download className="size-4" />
      </button>

    </div>
  )
}
