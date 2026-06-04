"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";

import { PageTransition } from "@/components/shared/PageTransition";
import { useAnalyticsSocket } from "@/hooks/useAnalyticsSocket";
import {
  useOverview,
  useVelocity,
  useAgents,
  useProjects,
  useAnomalies,
  useRefreshAnomalies,
  useAcknowledgeAnomaly,
  type OverviewMetrics,
  type VelocityMetrics,
  type AgentMetrics,
  type ProjectHealthMetrics,
} from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

// ─── Color constants (mirror the existing dashboard palette) ───

const TEAL = "#74959B";
const GREEN = "#49776B";
const AMBER = "#D4874A";
const RED = "#C0504A";
const PRIMARY = "#6366f1";

// ─── Metric card ─────────────────────────────────────────────

function MetricCard({
  label,
  value,
  unit,
  trend,
  color = PRIMARY,
  suffix,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  color?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div
      className="glass-panel rounded-xl p-5 space-y-3"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider text-[10px]">
          {label}
        </span>
        {trend && (
          <span
            className={cn(
              "text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded",
              trend === "up" && "text-forest-green bg-forest-green/10",
              trend === "down" && "text-red bg-red/10",
              trend === "stable" && "text-[var(--foreground-3)] bg-[var(--surface-3)]",
            )}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trend}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span
          className="text-3xl font-bold font-mono"
          style={{ color }}
        >
          {value}
          {unit && (
            <span className="ml-1 text-sm font-normal text-[var(--foreground-3)]">
              {unit}
            </span>
          )}
        </span>
        {suffix}
      </div>
    </div>
  );
}

// ─── Sparkline (tiny inline SVG) ─────────────────────────────

function Sparkline({
  values,
  color = TEAL,
  width = 80,
  height = 32,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline
        points={points}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Velocity chart with forecast ────────────────────────────

function VelocityPanel({ data }: { data: VelocityMetrics | undefined }) {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const gridStroke = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";

  // Merge historical + forecast so the line can transition seamlessly.
  const merged = React.useMemo(() => {
    if (!data) return [] as Array<Record<string, number | string | null>>;
    const hist = data.dailyData.map((d) => ({
      date: d.date,
      completed: d.completed,
      forecast: null as number | null,
    }));
    const forecast = data.forecast.map((f) => ({
      date: f.date,
      completed: null as number | null,
      forecast: f.tasks as number,
    }));
    return [...hist, ...forecast];
  }, [data]);

  if (!data) {
    return (
      <div className="glass-panel rounded-xl p-5 h-[350px] flex items-center justify-center text-sm text-[var(--foreground-3)]">
        Loading velocity…
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 glass-panel rounded-xl p-5 flex flex-col h-[350px]">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Task Velocity</h3>
          <p className="text-[11px] text-[var(--foreground-3)] font-mono">
            Completed daily · 14d forecast dashed
          </p>
        </div>
        <div className="flex gap-3 items-center text-[10px] font-mono text-[var(--foreground-3)] uppercase">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: TEAL }} />
            Completed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: AMBER }} />
            Forecast
          </div>
        </div>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={merged}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={TEAL} stopOpacity={0.15} />
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
            <Area
              type="monotone"
              dataKey="completed"
              stroke={TEAL}
              strokeWidth={2}
              fill="url(#velocityGrad)"
              connectNulls={false}
              dot={{ r: 2, fill: TEAL }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke={AMBER}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Agent success/failure bars ──────────────────────────────

function AgentPanel({ data }: { data: AgentMetrics | undefined }) {
  if (!data) {
    return (
      <div className="glass-panel rounded-xl p-5 h-[350px] flex items-center justify-center text-sm text-[var(--foreground-3)]">
        Loading agents…
      </div>
    );
  }
  const chartData = data.agents.slice(0, 8).map((a) => ({
    name: a.agentName,
    success: a.successCount,
    failed: a.failureCount,
  }));

  return (
    <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col h-[350px]">
      <div>
        <h3 className="text-sm font-bold text-foreground">Agent Activity</h3>
        <p className="text-[11px] text-[var(--foreground-3)] font-mono">
          {data.totalExecutions} executions · {data.overallSuccessRate}% success
        </p>
      </div>
      <div className="flex-1 w-full min-h-0 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--glass-border)" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--foreground-3)" }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(37,40,39,0.9)",
                borderColor: "var(--glass-border)",
                borderRadius: "10px",
                color: "#fff",
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
            <Bar dataKey="success" stackId="a" fill={GREEN} name="Success" />
            <Bar dataKey="failed" stackId="a" fill={RED} name="Failed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Project health donut ────────────────────────────────────

function ProjectsPanel({ data }: { data: ProjectHealthMetrics | undefined }) {
  if (!data) {
    return (
      <div className="glass-panel rounded-xl p-5 h-[320px] flex items-center justify-center text-sm text-[var(--foreground-3)]">
        Loading projects…
      </div>
    );
  }
  const healthy = data.projects.filter((p) => p.healthScore >= 80).length;
  const atRisk = data.projects.filter((p) => p.healthScore >= 50 && p.healthScore < 80).length;
  const critical = data.projects.filter((p) => p.healthScore < 50).length;
  const pieData = [
    { name: "Healthy", value: healthy, color: GREEN },
    { name: "At risk", value: atRisk, color: AMBER },
    { name: "Critical", value: critical, color: RED },
  ].filter((d) => d.value > 0);

  return (
    <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col h-[320px]">
      <div>
        <h3 className="text-sm font-bold text-foreground">Project Health</h3>
        <p className="text-[11px] text-[var(--foreground-3)] font-mono">
          {data.totalProjects} projects · avg {data.avgHealth}%
        </p>
      </div>
      <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-foreground">{data.avgHealth}%</span>
          <span className="text-[9px] font-mono uppercase text-[var(--foreground-3)]">
            Avg health
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-[var(--foreground-3)] pt-3 border-t border-[var(--glass-border)] uppercase">
        {pieData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span>
              {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Anomaly alerts panel ────────────────────────────────────

function AnomaliesPanel({
  anomalies,
  onAcknowledge,
  onRefresh,
  isRefreshing,
}: {
  anomalies: ReturnType<typeof useAnomalies>["data"];
  onAcknowledge: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="glass-panel rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">AI-Detected Anomalies</h3>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber font-mono bg-amber/10 border border-amber/20 rounded px-1.5 py-0.5">
            <ShieldAlert className="size-3" />
            <span>Phase 11</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-[11px] font-mono text-[var(--foreground-3)] hover:text-foreground inline-flex items-center gap-1"
          >
            <RefreshCcw className={cn("size-3", isRefreshing && "animate-spin")} />
            Re-scan
          </button>
          <Link
            href="/analytics/anomalies"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 font-mono"
          >
            All anomalies <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {!anomalies || anomalies.length === 0 ? (
          <div className="text-sm text-[var(--foreground-3)] font-mono py-6 text-center">
            No anomalies in window · system nominal
          </div>
        ) : (
          anomalies.slice(0, 4).map((a) => {
            const Icon =
              a.severity === "critical"
                ? AlertTriangle
                : a.severity === "warning"
                  ? ShieldAlert
                  : CheckCircle2;
            return (
              <div
                key={a.id}
                className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3 text-sm last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      "size-5 mt-0.5 shrink-0",
                      a.severity === "critical" && "text-red",
                      a.severity === "warning" && "text-amber",
                      a.severity === "low" && "text-forest-green",
                    )}
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {a.metric.replace(/_/g, " ")} — {a.description}
                    </h4>
                    <p className="text-xs text-[var(--foreground-3)] font-mono mt-1">
                      {a.severity} · {a.deviations.toFixed(1)}σ ·{" "}
                      {new Date(a.detectedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {a.acknowledgedAt ? (
                  <span className="text-[10px] font-mono font-bold uppercase text-forest-green bg-forest-green/10 border border-forest-green/20 rounded px-2 py-0.5">
                    Acked
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAcknowledge(a.id)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 font-mono shrink-0"
                  >
                    Ack <ArrowUpRight className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────

export default function AnalyticsOverviewPage() {
  // Subscribe to all five dashboards so any backend tick invalidates
  // the matching React Query cache. Mounting this once on the
  // overview page is enough for the entire analytics tree.
  useAnalyticsSocket(["overview", "velocity", "agents", "projects", "anomalies"]);

  const overview = useOverview();
  const velocity = useVelocity(30);
  const agents = useAgents(30);
  const projects = useProjects(20);
  const anomalies = useAnomalies();
  const refreshAnomalies = useRefreshAnomalies();
  const acknowledge = useAcknowledgeAnomaly();

  return (
    <PageTransition className="flex flex-col gap-6 pb-12">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="size-5 text-[hsl(var(--primary))]" />
            Analytics
          </h1>
          <p className="text-[13px] text-[var(--foreground-2)]">
            Real-time business intelligence · live socket stream
          </p>
        </div>
        <nav className="flex items-center gap-2 text-[11px] font-mono text-[var(--foreground-3)] uppercase">
          <Link href="/analytics/velocity" className="hover:text-foreground">Velocity</Link>
          <span>·</span>
          <Link href="/analytics/agents" className="hover:text-foreground">Agents</Link>
          <span>·</span>
          <Link href="/analytics/anomalies" className="hover:text-foreground">Anomalies</Link>
          <span>·</span>
          <Link href="/analytics/forecasts" className="hover:text-foreground">Forecasts</Link>
          <span>·</span>
          <Link href="/analytics/snapshots" className="hover:text-foreground">Snapshots</Link>
          <span>·</span>
          <Link href="/analytics/reports" className="hover:text-foreground">Reports</Link>
        </nav>
      </div>

      {/* ── Top row of metric cards ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {overview.data ? (
          <OverviewCards
            data={overview.data}
            sparkline={
              velocity.data?.dailyData.map((d) => d.completed) ?? []
            }
          />
        ) : (
          <SkeletonCards count={6} />
        )}
      </div>

      {/* ── Velocity + agents row ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <VelocityPanel data={velocity.data} />
        <AgentPanel data={agents.data} />
      </div>

      {/* ── Projects + team health row ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProjectsPanel data={projects.data} />
        <TeamHealthCard data={overview.data} />
        <AlertsCard data={overview.data} />
      </div>

      {/* ── Anomalies panel ───────────────────────────────── */}
      <AnomaliesPanel
        anomalies={anomalies.data}
        onAcknowledge={(id) => acknowledge.mutate(id)}
        onRefresh={() => refreshAnomalies.mutate()}
        isRefreshing={refreshAnomalies.isPending}
      />

      {/* ── Footer sub-links ──────────────────────────────── */}
      <SubLinks />
    </PageTransition>
  );
}

// ─── Sub-components specific to this page ────────────────────

function OverviewCards({
  data,
  sparkline,
}: {
  data: OverviewMetrics;
  sparkline: number[];
}) {
  return (
    <>
      <MetricCard
        label="Active Tasks"
        value={data.activeTasks}
        color={PRIMARY}
        suffix={<Sparkline values={sparkline} color={PRIMARY} />}
      />
      <MetricCard
        label="Completed (7d)"
        value={data.completedTasksThisWeek}
        color={GREEN}
      />
      <MetricCard
        label="Velocity"
        value={data.completionVelocity.toFixed(2)}
        unit="tasks/day"
        color={AMBER}
      />
      <MetricCard
        label="Project Health"
        value={data.projectHealth}
        unit="%"
        color={data.projectHealth >= 80 ? GREEN : data.projectHealth >= 60 ? AMBER : RED}
      />
      <MetricCard
        label="Agent Efficiency"
        value={data.agentEfficiency}
        unit="%"
        color={data.agentEfficiency >= 80 ? GREEN : AMBER}
      />
      <MetricCard
        label="Uptime"
        value={data.systemUptime}
        unit="%"
        color={data.systemUptime >= 99 ? GREEN : AMBER}
        suffix={<CheckCircle2 className="size-4 text-forest-green" />}
      />
    </>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className="glass-panel rounded-xl p-5 h-[110px] animate-pulse bg-[var(--surface-2)]/40"
    />
  ));
}

function TeamHealthCard({ data }: { data: OverviewMetrics | undefined }) {
  if (!data) return <div className="glass-panel rounded-xl p-5 h-[320px] animate-pulse" />;
  return (
    <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col h-[320px] space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">Team Health</h3>
        <p className="text-[11px] text-[var(--foreground-3)] font-mono">
          Derived from project + agent signals
        </p>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3">
        <div className="text-3xl font-bold capitalize" style={{ color: TEAL }}>
          {data.teamMorale}
        </div>
        <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
          <Stat label="Morale" value={data.teamMorale} />
          <Stat label="Health" value={`${data.projectHealth}%`} />
          <Stat label="Agents OK" value={`${data.agentEfficiency}%`} />
          <Stat label="Uptime" value={`${data.systemUptime}%`} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2">
      <div className="text-[9px] uppercase text-[var(--foreground-3)] tracking-wider">
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function AlertsCard({ data }: { data: OverviewMetrics | undefined }) {
  if (!data) return <div className="glass-panel rounded-xl p-5 h-[320px] animate-pulse" />;
  return (
    <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col h-[320px] space-y-3">
      <div>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber" />
          Alerts & Risks
        </h3>
        <p className="text-[11px] text-[var(--foreground-3)] font-mono">
          {data.alerts.length} active · {data.topRisks.length} top risks
        </p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {data.alerts.length === 0 && data.topRisks.length === 0 ? (
          <div className="text-xs text-[var(--foreground-3)] font-mono text-center py-4">
            No active alerts
          </div>
        ) : (
          <>
            {data.alerts.map((a) => (
              <div
                key={a.id}
                className="rounded-md border px-3 py-2 text-[11px]"
                style={{
                  borderColor:
                    a.severity === "critical"
                      ? RED
                      : a.severity === "warning"
                        ? AMBER
                        : TEAL,
                }}
              >
                <div className="font-semibold text-foreground">{a.title}</div>
                <div className="text-[var(--foreground-3)] mt-0.5">
                  {a.description}
                </div>
              </div>
            ))}
            {data.topRisks.map((r, i) => (
              <div
                key={i}
                className="rounded-md border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-[11px]"
              >
                <div className="font-semibold text-foreground">{r.title}</div>
                <div className="text-[var(--foreground-3)] mt-0.5 font-mono">
                  {Math.round(r.probability * 100)}% · {r.impact} impact
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function SubLinks() {
  const links = [
    { href: "/analytics/velocity", label: "Velocity dashboard" },
    { href: "/analytics/agents", label: "Agent performance" },
    { href: "/analytics/anomalies", label: "Anomaly center" },
    { href: "/analytics/forecasts", label: "Forecasts" },
    { href: "/analytics/snapshots", label: "Saved snapshots" },
    { href: "/analytics/reports", label: "Custom reports" },
    { href: "/admin/analytics", label: "Admin insights" },
  ];
  return (
    <div className="glass-panel rounded-xl p-5">
      <h3 className="text-sm font-bold text-foreground mb-3">Dashboards</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] font-mono">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-md border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-foreground hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] transition-colors flex items-center justify-between"
          >
            {l.label}
            <ChevronRight className="size-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}
