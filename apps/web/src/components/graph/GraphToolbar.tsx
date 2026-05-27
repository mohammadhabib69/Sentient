"use client";

import { Filter, Maximize2, Minus, Plus } from "lucide-react";

interface GraphToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export function GraphToolbar({ onZoomIn, onZoomOut, onFit }: GraphToolbarProps) {
  return (
    <div className="absolute right-6 top-6 z-40 flex flex-col gap-2 rounded-xl border border-glass-border bg-surface-container-high/60 p-1.5 shadow-2xl backdrop-blur-xl">
      <button
        type="button"
        onClick={onZoomIn}
        title="Zoom In"
        className="rounded-lg p-2.5 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
      >
        <Plus className="size-5" />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        title="Zoom Out"
        className="rounded-lg p-2.5 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
      >
        <Minus className="size-5" />
      </button>
      <div className="my-0.5 h-px w-full bg-outline-variant/50" />
      <button
        type="button"
        onClick={onFit}
        title="Fit to Screen"
        className="rounded-lg p-2.5 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
      >
        <Maximize2 className="size-5" />
      </button>
      <button
        type="button"
        title="Filter Nodes"
        className="rounded-lg p-2.5 text-mist-teal transition-colors hover:bg-surface-container-highest hover:text-primary"
      >
        <Filter className="size-5" />
      </button>
    </div>
  );
}
