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
    <div className="flex h-full flex-col rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)]">
      <div className="border-b border-[var(--glass-border)] px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Reality Stream</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {recentEvents.map((event) => {
            const isError = event.type === 'webhook_failed'
            const isAgent = event.actor.type === 'agent'
            const isUser = event.actor.type === 'user'

            const Icon = isError ? AlertTriangle : isAgent ? Bot : isUser ? User : Cpu
            const bgColor = isError ? 'bg-[var(--red)]/10 text-[var(--red)]' : 
                          isAgent ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 
                          'bg-[var(--foreground-3)] text-[var(--foreground-2)]'

            return (
              <div 
                key={event.id} 
                className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-2)]"
              >
                <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", bgColor)}>
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm text-[var(--foreground-2)]">
                    <span className="font-medium text-foreground">{event.actor.name}</span>
                    {' '}
                    {event.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-[var(--foreground-3)]">
                    {new Date(event.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
