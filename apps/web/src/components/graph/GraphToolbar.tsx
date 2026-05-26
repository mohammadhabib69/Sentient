"use client"

import * as React from "react"
import { ZoomIn, ZoomOut, Maximize, Target, Filter } from "lucide-react"

interface GraphToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onCenter: () => void
  onToggleBottlenecks: () => void
}

export function GraphToolbar({ onZoomIn, onZoomOut, onFit, onCenter, onToggleBottlenecks }: GraphToolbarProps) {
  const [bottlenecksActive, setBottlenecksActive] = React.useState(false)

  const handleToggleBottlenecks = () => {
    setBottlenecksActive(!bottlenecksActive)
    onToggleBottlenecks()
  }

  return (
    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl z-30">
      
      <div className="flex items-center border-r border-[var(--glass-border)] pr-1 mr-1">
        <button onClick={onZoomIn} className="rounded-lg p-2 text-[var(--foreground-2)] hover:bg-[var(--surface-2)] hover:text-foreground" title="Zoom In">
          <ZoomIn className="size-4" />
        </button>
        <button onClick={onZoomOut} className="rounded-lg p-2 text-[var(--foreground-2)] hover:bg-[var(--surface-2)] hover:text-foreground" title="Zoom Out">
          <ZoomOut className="size-4" />
        </button>
        <button onClick={onFit} className="rounded-lg p-2 text-[var(--foreground-2)] hover:bg-[var(--surface-2)] hover:text-foreground" title="Fit to Screen">
          <Maximize className="size-4" />
        </button>
        <button onClick={onCenter} className="rounded-lg p-2 text-[var(--foreground-2)] hover:bg-[var(--surface-2)] hover:text-foreground" title="Center Topology">
          <Target className="size-4" />
        </button>
      </div>

      <button 
        onClick={handleToggleBottlenecks}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          bottlenecksActive ? "bg-[var(--red)]/20 text-[var(--red)]" : "text-[var(--foreground-2)] hover:bg-[var(--surface-2)] hover:text-foreground"
        }`}
      >
        <Filter className="size-4" />
        Highlight Bottlenecks
      </button>

    </div>
  )
}
