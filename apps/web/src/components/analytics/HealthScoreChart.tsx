"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MOCK_HEALTH_METRICS } from "@/mocks/fixtures/analytics.fixture";
import { HeartPulse } from "lucide-react";

export function HealthScoreChart() {
  const data = [
    { name: "Healthy", value: MOCK_HEALTH_METRICS.agentSuccessRate },
    { name: "Failed", value: 100 - MOCK_HEALTH_METRICS.agentSuccessRate },
  ];
  const COLORS = ["hsl(var(--green))", "hsl(var(--red))"];

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] shadow-sm">
      <div className="border-b border-[var(--glass-border)] p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <HeartPulse className="size-4 text-green" />
          System Health
        </h3>
        <p className="mt-1 text-xs text-[var(--foreground-3)]">Agent execution success rate</p>
      </div>
      <div className="relative flex-1 p-5">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--glass-bg)",
                borderColor: "var(--glass-border)",
                borderRadius: "8px",
                color: "var(--foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-8">
          <span className="text-3xl font-bold text-foreground">
            {MOCK_HEALTH_METRICS.agentSuccessRate}%
          </span>
          <span className="text-xs text-[var(--foreground-3)]">Success Rate</span>
        </div>
      </div>
    </div>
  );
}
