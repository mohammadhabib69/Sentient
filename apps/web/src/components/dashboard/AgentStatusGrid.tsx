"use client"

import { useAgents } from "@/hooks/useAgents"
import { Bot, ShieldAlert, LineChart, Code2 } from "lucide-react"

const ICONS: Record<string, any> = {
  operations: Bot,
  finance: LineChart,
  customer: ShieldAlert,
  dev: Code2,
}

const COLORS: Record<string, string> = {
  operations: "var(--primary)",
  finance: "var(--green)",
  customer: "var(--red)",
  dev: "var(--amber)",
}

export function AgentStatusGrid() {
  const { data: agents = [], isLoading } = useAgents()

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-2)]" />
  }

  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">Agent Fleet Status</h2>
      <div className="grid grid-cols-2 gap-4">
        {agents.map((agent) => {
          const Icon = ICONS[agent.type] || Bot
          const color = COLORS[agent.type] || "var(--primary)"

          return (
            <div key={agent.id} className="flex flex-col rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-center justify-between">
                <div 
                  className="flex size-8 items-center justify-center rounded-md bg-opacity-20"
                  style={{ backgroundColor: `color-mix(in srgb, hsl(${color}) 20%, transparent)`, color: `hsl(${color})` }}
                >
                  <Icon className="size-4" style={{ color: `hsl(${color})` }} />
                </div>
                {agent.isActive ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75"></span>
                      <span className="relative inline-flex size-1.5 rounded-full bg-green"></span>
                    </span>
                    Active
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[var(--foreground-3)]">Idle</span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                <p className="text-xs text-[var(--foreground-3)]">{agent.actionsCount.toLocaleString()} actions</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
