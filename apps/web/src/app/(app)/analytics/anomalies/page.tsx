"use client";

import * as React from "react";
import { ArrowLeft, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  useAnomalies,
  useAcknowledgeAnomaly,
  useRefreshAnomalies,
} from "@/hooks/useAnalytics";
import { useAnalyticsSocket } from "@/hooks/useAnalyticsSocket";
import { cn } from "@/lib/utils";

const RED = "#C0504A";
const AMBER = "#D4874A";
const GREEN = "#49776B";

type Severity = "low" | "warning" | "critical";

export default function AnomaliesPage() {
  useAnalyticsSocket(["anomalies"]);
  const { data, isLoading } = useAnomalies();
  const acknowledge = useAcknowledgeAnomaly();
  const refresh = useRefreshAnomalies();

  const [severity, setSeverity] = React.useState<Severity | "all">("all");
  const filtered = React.useMemo(() => {
    if (!data) return [];
    if (severity === "all") return data;
    return data.filter((a) => a.severity === severity);
  }, [data, severity]);

  return (
    <PageTransition className="flex flex-col gap-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/analytics"
            className="text-[11px] font-mono text-[var(--foreground-3)] hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="size-3" /> Overview
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground mt-1">
            Anomaly Center
          </h1>
          <p className="text-[13px] text-[var(--foreground-2)]">
            Statistical (z-score) anomalies detected hourly
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="text-xs font-mono font-semibold text-[hsl(var(--primary))] hover:underline inline-flex items-center gap-1.5"
        >
          <RefreshCcw className={cn("size-3.5", refresh.isPending && "animate-spin")} />
          Re-scan now
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {(["all", "critical", "warning", "low"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverity(s)}
            className={cn(
              "px-3 py-1 text-[11px] font-mono font-semibold rounded-md border transition-colors uppercase",
              severity === s
                ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                : "border-[var(--glass-border)] text-[var(--foreground-3)] hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <div className="glass-panel rounded-xl p-12 text-center text-sm text-[var(--foreground-3)] font-mono">
          Loading anomalies…
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center text-sm text-[var(--foreground-3)] font-mono">
          No anomalies in this window · system nominal
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const Icon =
              a.severity === "critical"
                ? AlertTriangle
                : a.severity === "warning"
                  ? ShieldAlert
                  : CheckCircle2;
            const color =
              a.severity === "critical"
                ? RED
                : a.severity === "warning"
                  ? AMBER
                  : GREEN;
            return (
              <div
                key={a.id}
                className="glass-panel rounded-xl p-5 space-y-3"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Icon className="size-5 mt-0.5 shrink-0" style={{ color }} />
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {a.metric.replace(/_/g, " ")}
                      </h3>
                      <p className="text-sm text-[var(--foreground-2)] mt-1">
                        {a.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--foreground-3)] mt-2">
                        <span>
                          Value: <strong className="text-foreground">{a.value}</strong>
                        </span>
                        <span>
                          Expected: {a.expected.mean} ± {a.expected.stdDev}
                        </span>
                        <span>
                          Range: [{a.expected.min}, {a.expected.max}]
                        </span>
                        <span>
                          σ: <strong style={{ color }}>{a.deviations.toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                      style={{
                        color,
                        backgroundColor: `${color}15`,
                      }}
                    >
                      {a.severity}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--foreground-3)]">
                      {new Date(a.detectedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {a.acknowledgedAt ? (
                  <div className="text-[11px] font-mono text-forest-green">
                    ✓ Acknowledged {new Date(a.acknowledgedAt).toLocaleString()}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => acknowledge.mutate(a.id)}
                    disabled={acknowledge.isPending}
                    className="text-[11px] font-mono font-semibold text-[hsl(var(--primary))] hover:underline"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
