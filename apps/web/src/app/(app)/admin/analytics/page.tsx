"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Camera,
  FileText,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { useAdminInsights } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

const GREEN = "#49776B";
const AMBER = "#D4874A";
const RED = "#C0504A";
const TEAL = "#74959B";

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useAdminInsights();

  if (isLoading || !data) {
    return (
      <PageTransition className="flex flex-col gap-6 pb-12">
        <Header />
        <div className="glass-panel rounded-xl p-12 text-center text-sm text-[var(--foreground-3)] font-mono">
          Loading admin insights…
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col gap-6 pb-12">
      <Header />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Kpi
          label="Active Agents"
          value={data.activeAgents}
          color={TEAL}
          icon={<Workflow className="size-4" />}
        />
        <Kpi
          label="Agents < 80%"
          value={data.agentsWithFailures}
          color={data.agentsWithFailures > 0 ? AMBER : GREEN}
          icon={<Activity className="size-4" />}
        />
        <Kpi
          label="Dead Letters"
          value={data.totalDeadLetters}
          color={data.totalDeadLetters > 0 ? RED : GREEN}
          icon={<AlertTriangle className="size-4" />}
        />
        <Kpi
          label="Pending Anomalies"
          value={data.pendingAnomalies}
          color={data.pendingAnomalies > 0 ? AMBER : GREEN}
          icon={<ShieldAlert className="size-4" />}
        />
        <Kpi
          label="Saved Snapshots"
          value={data.totalSnapshots}
          color={TEAL}
          icon={<Camera className="size-4" />}
        />
        <Kpi
          label="Scheduled Reports"
          value={data.scheduledReports}
          color={TEAL}
          icon={<FileText className="size-4" />}
        />
      </div>

      {/* Queue table */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Queue health</h3>
        {data.queues.length === 0 ? (
          <div className="text-sm text-[var(--foreground-3)] font-mono py-4 text-center">
            No queues registered
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)] text-left text-[10px] font-mono uppercase text-[var(--foreground-3)]">
                  <th className="px-3 py-2">Queue</th>
                  <th className="px-3 py-2 text-right">Waiting</th>
                  <th className="px-3 py-2 text-right">Active</th>
                  <th className="px-3 py-2 text-right">Delayed</th>
                  <th className="px-3 py-2 text-right">Failed</th>
                  <th className="px-3 py-2 text-right">Health</th>
                </tr>
              </thead>
              <tbody>
                {data.queues.map((q) => {
                  const color =
                    q.health === "healthy" ? GREEN : q.health === "warning" ? AMBER : RED;
                  return (
                    <tr
                      key={q.name}
                      className="border-b border-[var(--glass-border)]/40 last:border-b-0"
                    >
                      <td className="px-3 py-2 font-mono">{q.name}</td>
                      <td className="px-3 py-2 text-right font-mono">{q.waiting}</td>
                      <td className="px-3 py-2 text-right font-mono">{q.active}</td>
                      <td className="px-3 py-2 text-right font-mono">{q.delayed}</td>
                      <td className="px-3 py-2 text-right font-mono">{q.failed}</td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase"
                          style={{
                            color,
                            backgroundColor: `${color}15`,
                          }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {q.health}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cross-links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/queue-monitoring"
          className="glass-panel rounded-xl p-5 hover:border-[hsl(var(--primary))] transition-colors"
        >
          <h3 className="text-sm font-bold text-foreground">Queue monitor</h3>
          <p className="text-[11px] text-[var(--foreground-3)] mt-1 font-mono">
            Inspect individual jobs, DLQ, retry / remove
          </p>
        </Link>
        <Link
          href="/analytics/anomalies"
          className="glass-panel rounded-xl p-5 hover:border-[hsl(var(--primary))] transition-colors"
        >
          <h3 className="text-sm font-bold text-foreground">Anomaly center</h3>
          <p className="text-[11px] text-[var(--foreground-3)] mt-1 font-mono">
            {data.pendingAnomalies} unacknowledged findings
          </p>
        </Link>
      </div>
    </PageTransition>
  );
}

function Header() {
  return (
    <div>
      <Link
        href="/analytics"
        className="text-[11px] font-mono text-[var(--foreground-3)] hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="size-3" /> Overview
      </Link>
      <h1 className="text-xl font-bold tracking-tight text-foreground mt-1">
        Admin Insights
      </h1>
      <p className="text-[13px] text-[var(--foreground-2)]">
        System health, queue metrics, agent performance
      </p>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="glass-panel rounded-xl p-5 space-y-2"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase text-[var(--foreground-3)] tracking-wider">
          {label}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-3xl font-bold font-mono" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
