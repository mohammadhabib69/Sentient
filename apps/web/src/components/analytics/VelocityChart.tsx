"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MOCK_VELOCITY_DATA } from "@/mocks/fixtures/analytics.fixture";
import { Activity } from "lucide-react";

export function VelocityChart() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-5">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Activity className="size-4 text-[hsl(var(--primary))]" />
            Delivery Velocity
          </h3>
          <p className="mt-1 text-xs text-[var(--foreground-3)]">
            Tasks completed over the last 30 days
          </p>
        </div>
      </div>
      <div className="flex-1 p-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={MOCK_VELOCITY_DATA}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--foreground-3)" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--foreground-3)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--glass-bg)",
                borderColor: "var(--glass-border)",
                borderRadius: "12px",
                backdropFilter: "blur(20px)",
                color: "var(--foreground)",
              }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
            <Line
              type="monotone"
              name="Total Tasks"
              dataKey="completedTasks"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: "hsl(var(--primary))",
                stroke: "var(--surface-1)",
                strokeWidth: 2,
              }}
            />
            <Line
              type="monotone"
              name="Agent Automated"
              dataKey="agentAutomated"
              stroke="hsl(var(--secondary))"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: "hsl(var(--secondary))",
                stroke: "var(--surface-1)",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
