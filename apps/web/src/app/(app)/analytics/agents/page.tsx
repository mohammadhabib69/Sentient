"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { useAgents } from "@/hooks/useAnalytics";
import { useAnalyticsSocket } from "@/hooks/useAnalyticsSocket";
import { cn } from "@/lib/utils";

const GREEN = "#49776B";
const RED = "#C0504A";
const AMBER = "#D4874A";
const TEAL = "#74959B";
const PIE_COLORS = ["#3b82f6", GREEN, AMBER, RED, "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AgentsPage() {
  useAnalyticsSocket(["agents"]);
  const { data, isLoading } = useAgents(30);

  if (isLoading || !data) {
    return (
      <PageTransition className="flex flex-col gap-6 pb-12">
        <Header />
        <div className="glass-panel rounded-xl p-12 text-center text-sm text-[var(--foreground-3)] font-mono">
          Loading agents…
        </div>
      </PageTransition>
    );
  }

  const chartData = data.agents.map((a) => ({
    name: a.agentName,
    success: a.successCount,
    failed: a.failureCount,
  }));

  const errorData = Object.entries(data.errorDistribution)
    .map(([error, count]) => ({ name: error, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <PageTransition className="flex flex-col gap-6 pb-12">
      <Header />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Overall Success Rate" value={`${data.overallSuccessRate}%`} color={data.overallSuccessRate >= 80 ? GREEN : AMBER} />
        <Stat label="Total Executions" value={data.totalExecutions} color={TEAL} />
        <Stat label="Active Agents" value={data.agents.length} color={TEAL} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Success vs failure bar */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Success vs Failure by Agent</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--foreground-3)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--foreground-3)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(37,40,39,0.9)",
                    borderColor: "var(--glass-border)",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="success" fill={GREEN} name="Success" />
                <Bar dataKey="failed" fill={RED} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error pie */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Error distribution</h3>
          {errorData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-[var(--foreground-3)] font-mono">
              No errors in window
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${(name as string).slice(0, 12)} ${((percent as number) * 100).toFixed(0)}%`
                    }
                  >
                    {errorData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(37,40,39,0.9)",
                      borderColor: "var(--glass-border)",
                      borderRadius: "10px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Agent details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-left text-[10px] font-mono uppercase text-[var(--foreground-3)]">
                <th className="px-3 py-2">Agent</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Success Rate</th>
                <th className="px-3 py-2 text-right">Avg Time</th>
                <th className="px-3 py-2 text-right">Trend</th>
                <th className="px-3 py-2 text-right">Last Action</th>
              </tr>
            </thead>
            <tbody>
              {data.agents.map((a) => (
                <tr key={a.agentId} className="border-b border-[var(--glass-border)]/40 last:border-b-0">
                  <td className="px-3 py-2 font-semibold">{a.agentName}</td>
                  <td className="px-3 py-2 text-[var(--foreground-3)] font-mono text-[11px]">
                    {a.agentType}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{a.totalActions}</td>
                  <td
                    className="px-3 py-2 text-right font-mono font-bold"
                    style={{
                      color:
                        a.successRate > 80 ? GREEN : a.successRate > 60 ? AMBER : RED,
                    }}
                  >
                    {a.successRate}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] text-[var(--foreground-3)]">
                    {a.avgExecutionMs}ms
                  </td>
                  <td className="px-3 py-2 text-right">
                    <TrendBadge trend={a.trend} />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] text-[var(--foreground-3)]">
                    {a.lastActionAt
                      ? new Date(a.lastActionAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        Agent Performance
      </h1>
      <p className="text-[13px] text-[var(--foreground-2)]">
        Per-agent success rate, latency, common errors
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="glass-panel rounded-xl p-5" style={{ borderTop: `3px solid ${color}` }}>
      <div className="text-[10px] font-mono uppercase text-[var(--foreground-3)] tracking-wider">
        {label}
      </div>
      <div className="text-2xl font-bold font-mono mt-2" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: "improving" | "declining" | "stable" }) {
  const Icon =
    trend === "improving" ? ArrowUpRight : trend === "declining" ? ArrowDownRight : Minus;
  const color = trend === "improving" ? GREEN : trend === "declining" ? RED : AMBER;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded",
      )}
      style={{
        color,
        backgroundColor: `${color}15`,
      }}
    >
      <Icon className="size-3" />
      {trend}
    </span>
  );
}
