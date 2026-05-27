"use client";

import * as React from "react";
import { ShieldAlert, AlertTriangle } from "lucide-react";

export function AnomalyAlerts() {
  const anomalies = [
    { id: 1, title: "Unusual token usage spike", agent: "Flux", severity: "high", time: "10m ago" },
    {
      id: 2,
      title: "Database latency elevated",
      agent: "System",
      severity: "medium",
      time: "1h ago",
    },
    {
      id: 3,
      title: "Multiple webhook failures",
      agent: "Aria",
      severity: "medium",
      time: "3h ago",
    },
    {
      id: 4,
      title: "Config override detected",
      agent: "Mohammad",
      severity: "low",
      time: "5h ago",
    },
  ];

  const severityColors: Record<string, string> = {
    high: "bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/20",
    medium: "bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/20",
    low: "bg-[var(--foreground-3)]/10 text-[var(--foreground-3)] border-[var(--foreground-3)]/20",
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] shadow-sm">
      <div className="border-b border-[var(--glass-border)] p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShieldAlert className="size-4 text-[var(--red)]" />
          Anomaly Detection
        </h3>
        <p className="mt-1 text-xs text-[var(--foreground-3)]">AI detected deviations</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {anomalies.map((anomaly) => (
          <div
            key={anomaly.id}
            className="flex items-start gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-3"
          >
            <AlertTriangle
              className={`mt-0.5 size-4 shrink-0 ${anomaly.severity === "high" ? "text-[var(--red)]" : "text-[var(--amber)]"}`}
            />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground">{anomaly.title}</h4>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-[var(--foreground-3)]">Source: {anomaly.agent}</span>
                <span className="text-[var(--foreground-3)]">{anomaly.time}</span>
              </div>
            </div>
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${severityColors[anomaly.severity]}`}
            >
              {anomaly.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
