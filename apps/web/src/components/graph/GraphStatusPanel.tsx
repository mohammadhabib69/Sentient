"use client";

import { AlertTriangle, FolderKanban, History } from "lucide-react";

export function GraphStatusPanel() {
  return (
    <div className="pointer-events-auto absolute left-6 top-6 z-40 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-glass-border bg-surface-container-low/85 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <div className="flex items-start justify-between border-b border-outline-variant/50 bg-gradient-to-b from-surface-container-high/50 to-transparent p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
            <FolderKanban className="size-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold leading-tight text-on-surface">Project Nexus</h3>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="size-2 animate-pulse rounded-full bg-error-red shadow-[0_0_8px_rgba(192,80,74,0.8)]" />
              <span className="font-mono text-xs text-error-red">Degraded State</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container/50 p-4">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Health Score
            </span>
            <span className="font-mono text-xl font-bold text-amber-alert">78%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-dim">
            <div className="h-1.5 w-[78%] rounded-full bg-amber-alert" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 rounded-xl border border-outline-variant/20 bg-surface-container/30 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Connected Nodes
            </span>
            <span className="font-mono text-lg text-on-surface">
              14 <span className="ml-1 text-xs text-on-surface-variant">Total</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl border border-error-red/20 bg-error-container/10 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-error-red">
              Critical Paths
            </span>
            <span className="font-mono text-lg text-error-red">
              1 <span className="ml-1 text-xs text-error-red/70">Flagged</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl border border-outline-variant/20 bg-surface-container/30 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Agents Active
            </span>
            <span className="font-mono text-lg text-forest-green">2</span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl border border-outline-variant/20 bg-surface-container/30 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Network Load
            </span>
            <span className="font-mono text-lg text-on-surface">42%</span>
          </div>
        </div>

        <div className="h-px w-full bg-outline-variant/30" />

        <div>
          <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
            <AlertTriangle className="size-3.5" />
            Active Bottlenecks
          </h4>
          <div className="relative overflow-hidden rounded-lg border border-error-red/30 bg-surface-container p-3">
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-error-red" />
            <div className="flex items-center justify-between pl-2">
              <span className="text-xs font-medium text-on-surface">Data Sync Failed</span>
              <span className="font-mono text-[10px] text-error-red">T-2m</span>
            </div>
            <p className="mt-1 pl-2 text-[11px] leading-relaxed text-on-surface-variant">
              Task blocked due to timeout in External_DB connection. Agent synthesizer stalled.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-b-2xl border-t border-outline-variant/30 bg-surface-container-highest/50 p-4">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-mist-teal transition-colors hover:text-primary"
        >
          <History className="size-4" />
          View Logs
        </button>
        <button
          type="button"
          className="rounded-lg border border-mist-teal/30 bg-mist-teal/10 px-5 py-2 text-xs font-semibold text-mist-teal shadow-sm transition-all hover:bg-mist-teal hover:text-surface-dim"
        >
          Resolve Issue
        </button>
      </div>
    </div>
  );
}
