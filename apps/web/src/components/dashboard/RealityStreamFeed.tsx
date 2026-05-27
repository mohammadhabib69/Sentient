"use client"

import { useStreamEvents } from "@/hooks/useStream"
import { Bot, User, Cpu, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export function RealityStreamFeed() {
  const { data: events = [], isLoading } = useStreamEvents()

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-[var(--surface-2)]" />
  }

  // Only take latest 8 events for dashboard view
  const recentEvents = events.slice(0, 8)

  return (
    <div className="flex h-full flex-col rounded-xl border border-glass-border bg-surface-container">
      <div className="border-b border-glass-border px-5 py-4">
        <h2 className="text-base font-semibold text-on-surface">Reality Stream</h2>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {recentEvents.map((event) => {
            const variant = event.display?.variant
            const isError = variant === "critical" || event.type === "webhook_failed"
            const isAgent = event.actor.type === "agent"
            const isUser = event.actor.type === "user"

            const Icon = isError ? AlertTriangle : isAgent ? Bot : isUser ? User : Cpu
            const bgColor = isError
              ? "bg-error-red/10 text-error-red"
              : isAgent
                ? "bg-primary/10 text-primary"
                : "bg-surface-variant text-on-surface-variant"

            return (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-container-high"
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                    bgColor
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-on-surface-variant">
                    <span className="font-medium text-on-surface">{event.actor.name}</span>
                    {event.display?.badge && (
                      <span className="ml-2 font-mono text-[9px] uppercase text-mist-teal">
                        {event.display.badge}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {event.display?.description ?? event.type.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
