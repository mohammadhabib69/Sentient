"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { useVelocity } from "@/hooks/useAnalytics";
import { useAnalyticsSocket } from "@/hooks/useAnalyticsSocket";
import { cn } from "@/lib/utils";

const TEAL = "#74959B";
const GREEN = "#49776B";
const AMBER = "#D4874A";
const RED = "#C0504A";

export default function VelocityPage() {
  useAnalyticsSocket(["velocity"]);
  const { data, isLoading } = useVelocity(30);
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const gridStroke = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";

  if (isLoading || !data) {
    return (
      <PageTransition className="flex flex-col gap-6 pb-12">
        <PageHeader />
        <div className="glass-panel rounded-xl p-12 text-center text-sm text-[var(--foreground-3)] font-mono">
          Loading velocity…
        </div>
      </PageTransition>
    );
  }

  const merged = [
    ...data.dailyData.map((d) => ({
      date: d.date,
      completed: d.completed,
      created: d.created,
      blocked: d.blocked,
      forecast: null as number | null,
    })),
    ...data.forecast.map((f) => ({
      date: f.date,
      completed: null as number | null,
      created: null as number | null,
      blocked: null as number | null,
      forecast: f.tasks,
    })),
  ];

  const TrendIcon =
    data.trend === "up" ? TrendingUp : data.trend === "down" ? TrendingDown : Minus;
  const trendColor =
    data.trend === "up" ? GREEN : data.trend === "down" ? RED : AMBER;

  return (
    <PageTransition className="flex flex-col gap-6 pb-12">
      <PageHeader />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          label="Throughput"
          value={`${data.throughput.toFixed(2)}`}
          unit="tasks/day"
          color={TEAL}
        />
        <Kpi
          label="Weekly Avg"
          value={data.weeklyAverage.toFixed(1)}
          unit="tasks/wk"
          color={GREEN}
        />
        <Kpi
          label="Cycle Time"
          value={data.cycleTime.toFixed(1)}
          unit="days"
          color={AMBER}
        />
        <div
          className="glass-panel rounded-xl p-5 space-y-3"
          style={{ borderTop: `3px solid ${trendColor}` }}
        >
          <div className="text-[10px] font-mono uppercase text-[var(--foreground-3)] tracking-wider">
            Trend
          </div>
          <div className="flex items-center gap-2">
            <TrendIcon className="size-5" style={{ color: trendColor }} />
            <span className="text-2xl font-bold capitalize" style={{ color: trendColor }}>
              {data.trend}
            </span>
          </div>
        </div>
      </div>

      {/* Main chart */}
      <div className="glass-panel rounded-xl p-5 h-[420px]">
        <div className="flex items-center justify-between pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Task completion + 14-day forecast
            </h3>
            <p className="text-[11px] text-[var(--foreground-3)] font-mono">
              Daily completed tasks from task_velocity_daily · forecast from linear regression
            </p>
          </div>
        </div>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={merged} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TEAL} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => d?.substring(5)}
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
              <Area
                type="monotone"
                name="Completed"
                dataKey="completed"
                stroke={TEAL}
                fill="url(#velGrad)"
                strokeWidth={2}
                connectNulls={false}
              />
              <Line
                type="monotone"
                name="Forecast"
                dataKey="forecast"
                stroke={AMBER}
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast table */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">14-day forecast</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-left text-[10px] font-mono uppercase text-[var(--foreground-3)]">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-right">Predicted</th>
              </tr>
            </thead>
            <tbody>
              {data.forecast.map((f) => (
                <tr
                  key={f.date}
                  className="border-b border-[var(--glass-border)]/40 last:border-b-0"
                >
                  <td className="px-3 py-2 font-mono text-[var(--foreground-2)]">
                    {f.date}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {f.tasks}
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

function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Link
          href="/analytics"
          className="text-[11px] font-mono text-[var(--foreground-3)] hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-3" /> Overview
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-foreground mt-1">
          Task Velocity
        </h1>
        <p className="text-[13px] text-[var(--foreground-2)]">
          Throughput, cycle time, and 14-day forecast
        </p>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div
      className="glass-panel rounded-xl p-5 space-y-3"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="text-[10px] font-mono uppercase text-[var(--foreground-3)] tracking-wider">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold font-mono" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-[var(--foreground-3)]">{unit}</span>
      </div>
    </div>
  );
}
