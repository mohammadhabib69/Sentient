"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { id: "all", label: "All", active: true },
  { id: "agent", label: "Agent Actions" },
  { id: "user", label: "User Actions" },
  { id: "anomalies", label: "Anomalies", accent: "amber" as const },
  { id: "system", label: "System" },
  { id: "errors", label: "Errors", accent: "error" as const },
];

export function StreamFilters() {
  const [activeType, setActiveType] = React.useState("all");
  const [timeRange, setTimeRange] = React.useState("24h");

  return (
    <aside className="flex h-full w-full flex-col gap-6 overflow-y-auto custom-scrollbar p-4 lg:w-[260px] lg:shrink-0 lg:border-r lg:border-glass-border lg:bg-surface-container/40 lg:backdrop-blur-[28px]">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">
          Filters
        </h2>
        <button
          type="button"
          className="font-mono text-mono-xs text-mist-teal transition-colors hover:text-primary"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-mono-xs text-on-surface-variant">EVENT TYPE</span>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setActiveType(type.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-body-sm transition-colors",
                activeType === type.id
                  ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                  : type.accent === "amber"
                    ? "border-amber-alert/30 bg-amber-alert/5 text-amber-alert hover:bg-amber-alert/10"
                    : type.accent === "error"
                      ? "border-error-red/30 bg-error-red/5 text-error-red hover:bg-error-red/10"
                      : "border-glass-border bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <span className="font-mono text-mono-xs text-outline-variant">ACTOR</span>
        <select className="w-full appearance-none rounded-lg border border-glass-border bg-surface-container px-3 py-2 text-body-sm text-on-surface outline-none focus:border-mist-teal focus:ring-1 focus:ring-mist-teal">
          <option>Any Actor</option>
          <option>Agent: Flux</option>
          <option>Agent: Nova</option>
          <option>User: Operator</option>
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <span className="font-mono text-mono-xs text-outline-variant">ENTITY TYPE</span>
        <select className="w-full appearance-none rounded-lg border border-glass-border bg-surface-container px-3 py-2 text-body-sm text-on-surface outline-none focus:border-mist-teal focus:ring-1 focus:ring-mist-teal">
          <option>All Entities</option>
          <option>Project File</option>
          <option>Database Record</option>
          <option>API Endpoint</option>
        </select>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-glass-border pt-4">
        <span className="font-mono text-mono-xs text-outline-variant">TIME RANGE</span>
        <div className="grid grid-cols-3 gap-2">
          {(["1h", "24h", "7d"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={cn(
                "rounded-lg border py-1.5 text-center font-mono text-mono-xs transition-colors",
                timeRange === range
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-glass-border bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
