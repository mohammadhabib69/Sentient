"use client"

import * as React from "react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts"
import { MOCK_AGENT_BREAKDOWN } from "@/mocks/fixtures/analytics.fixture"
import { Bot } from "lucide-react"

export function AgentBreakdownChart() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] shadow-sm">
      <div className="border-b border-[var(--glass-border)] p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Bot className="size-4 text-amber" />
          Agent Output Breakdown
        </h3>
        <p className="mt-1 text-xs text-[var(--foreground-3)]">Actions performed by domain</p>
      </div>
      <div className="flex-1 p-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_AGENT_BREAKDOWN} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
            <XAxis 
              dataKey="agent" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--foreground-3)' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--foreground-3)' }}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />
            <Tooltip
              cursor={{ fill: 'var(--surface-2)', opacity: 0.5 }}
              contentStyle={{ 
                backgroundColor: 'var(--glass-bg)', 
                borderColor: 'var(--glass-border)',
                borderRadius: '12px',
                backdropFilter: 'blur(20px)'
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            <Bar dataKey="operations" name="Operations" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} />
            <Bar dataKey="finance" name="Finance" stackId="a" fill="hsl(var(--green))" />
            <Bar dataKey="dev" name="Development" stackId="a" fill="hsl(var(--amber))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
