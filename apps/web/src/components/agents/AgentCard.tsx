"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Bot, LineChart, Code2, ShieldAlert } from "lucide-react"
import { Agent } from "@/types/agent.types"
import { cn } from "@/lib/utils"

interface AgentCardProps {
  agent: Agent
  onToggle: (id: string, active: boolean) => void
}

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

export function AgentCard({ agent, onToggle }: AgentCardProps) {
  const Icon = ICONS[agent.type] || Bot
  const color = COLORS[agent.type] || "var(--primary)"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5 shadow-sm transition-colors hover:bg-[var(--surface-2)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="flex size-10 items-center justify-center rounded-lg bg-opacity-15 shadow-sm"
            style={{ backgroundColor: `color-mix(in srgb, hsl(${color}) 15%, transparent)`, color: `hsl(${color})` }}
          >
            <Icon className="size-5" style={{ color: `hsl(${color})` }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{agent.name}</h3>
              {agent.isActive && (
                <motion.span 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex size-1.5 rounded-full"
                  style={{ backgroundColor: `hsl(${color})` }}
                />
              )}
            </div>
            <p className="text-xs text-[var(--foreground-3)] capitalize">{agent.type} Agent</p>
          </div>
        </div>

        {/* Custom Toggle Switch */}
        <button
          onClick={() => onToggle(agent.id, !agent.isActive)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            agent.isActive ? "bg-[hsl(var(--primary))]" : "bg-[var(--surface-3)]"
          )}
          aria-label={`Toggle ${agent.name} agent`}
        >
          <span
            className={cn(
              "pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
              agent.isActive ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-1">
        <p className="text-sm font-medium text-[var(--foreground-2)]">
          {agent.config?.system as string || "Automated task routing and execution."}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--glass-border)] pt-4 text-xs">
        <div className="flex flex-col">
          <span className="text-[var(--foreground-3)]">Approval Mode</span>
          <span className="font-medium text-[var(--foreground-2)] capitalize">{agent.approvalMode.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[var(--foreground-3)]">Actions</span>
          <span className="font-medium text-foreground">{agent.actionsCount.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  )
}
