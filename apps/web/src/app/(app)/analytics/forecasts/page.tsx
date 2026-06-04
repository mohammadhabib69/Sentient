"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  useForecasts,
  useRefreshForecasts,
  type ForecastRecord,
} from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

const TEAL = "#74959B";
const AMBER = "#D4874A";

export default function ForecastsPage() {
  const { data, isLoading } = useForecasts();
  const refresh = useRefreshForecasts();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = React.useMemo(() => {
    if (!data) return null;
    if (selectedId) return data.find((f) => f.id === selectedId) ?? data[0]!;
    return data[0] ?? null;
  }, [data, selectedId]);

  if (isLoading || !data) {
    return (
      <PageTransition className="flex flex-col gap-6 pb-12">
        <Header onRefresh={() => refresh.mutate()} isRefreshing={refresh.isPending} />
        <div className="glass-panel rounded-xl p-12 text-center text-sm text-[var(--foreground-3)] font-mono">
          Loading forecasts…
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col gap-6 pb-12">
      <Header onRefresh={() => refresh.mutate()} isRefreshing={refresh.isPending} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          {data.length === 0 ? (
            <div className="glass-panel rounded-xl p-5 text-sm text-[var(--foreground-3)] font-mono">
              No forecasts cached. Click "Regenerate" to compute fresh predictions.
            </div>
          ) : (
            data.map((f) => (
              <ForecastListItem
                key={f.id}
                forecast={f}
                active={selected?.id === f.id}
                onClick={() => setSelectedId(f.id)}
              />
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5">
          {selected ? (
            <ForecastDetail forecast={selected} />
          ) : (
            <div className="text-sm text-[var(--foreground-3)] font-mono text-center py-12">
              Select a forecast to inspect
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function Header({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
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
          Forecasts
        </h1>
        <p className="text-[13px] text-[var(--foreground-2)]">
          Linear regression projections, 7-day cache
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="text-xs font-mono font-semibold text-[hsl(var(--primary))] hover:underline inline-flex items-center gap-1.5"
      >
        <RefreshCcw className={cn("size-3.5", isRefreshing && "animate-spin")} />
        Regenerate
      </button>
    </div>
  );
}

function ForecastListItem({
  forecast,
  active,
  onClick,
}: {
  forecast: ForecastRecord;
  active: boolean;
  onClick: () => void;
}) {
  const accuracyPct = (forecast.accuracy * 100).toFixed(0);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg p-3 border transition-colors",
        active
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
          : "border-[var(--glass-border)] bg-[var(--surface-2)] hover:border-[hsl(var(--primary))]/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase text-[var(--foreground-3)]">
          {forecast.entityType}
        </span>
        <span
          className="text-[10px] font-mono font-semibold"
          style={{
            color: forecast.accuracy >= 0.7 ? TEAL : AMBER,
          }}
        >
          {accuracyPct}% R²
        </span>
      </div>
      <div className="text-sm font-semibold text-foreground mt-1 capitalize">
        {forecast.metric.replace(/_/g, " ")}
      </div>
      <div className="text-[10px] font-mono text-[var(--foreground-3)] mt-0.5">
        {forecast.predictions.length} points · expires{" "}
        {new Date(forecast.expiresAt).toLocaleDateString()}
      </div>
    </button>
  );
}

function ForecastDetail({ forecast }: { forecast: ForecastRecord }) {
  const chartData = forecast.predictions.map((p) => ({
    date: p.date,
    predicted: p.predicted,
    confidence: p.confidence * 100,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground capitalize">
          {forecast.metric.replace(/_/g, " ")} · {forecast.entityType}
        </h3>
        <p className="text-[11px] font-mono text-[var(--foreground-3)] mt-1">
          {forecast.model} model · accuracy R²={forecast.accuracy.toFixed(3)} ·
          generated {new Date(forecast.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
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
            <Line
              type="monotone"
              dataKey="predicted"
              stroke={TEAL}
              strokeWidth={2.5}
              dot={{ r: 3, fill: TEAL }}
              name="Predicted"
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke={AMBER}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              name="Confidence %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] text-left text-[10px] font-mono uppercase text-[var(--foreground-3)]">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Predicted</th>
              <th className="px-3 py-2 text-right">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {forecast.predictions.map((p) => (
              <tr
                key={p.date}
                className="border-b border-[var(--glass-border)]/40 last:border-b-0"
              >
                <td className="px-3 py-2 font-mono text-[var(--foreground-2)]">
                  {p.date}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {p.predicted.toFixed(1)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[var(--foreground-3)]">
                  {(p.confidence * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
