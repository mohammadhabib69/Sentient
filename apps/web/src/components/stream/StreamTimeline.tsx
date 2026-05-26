"use client"

import * as React from "react"
import { AnimatePresence } from "framer-motion"
import { useStreamEvents } from "@/hooks/useStream"
import { StreamEvent } from "@/types/event.types"
import { EventCard } from "@/components/stream/EventCard"

interface StreamTimelineProps {
  onSelectEvent: (event: StreamEvent) => void
  selectedEventId?: string
}

export function StreamTimeline({ onSelectEvent, selectedEventId }: StreamTimelineProps) {
  const { data: initialEvents = [], isLoading } = useStreamEvents()
  const [events, setEvents] = React.useState<StreamEvent[]>([])

  // Load initial events
  React.useEffect(() => {
    if (initialEvents.length > 0 && events.length === 0) {
      setEvents(initialEvents)
    }
  }, [initialEvents])

  // Simulate incoming live events every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvent: StreamEvent = {
          id: `sim_evt_${Date.now()}`,
          type: 'agent_status_changed',
          aggregateId: 'agt_simulate',
          aggregateType: 'agent',
          occurredAt: new Date().toISOString(),
          actor: { id: 'sys_1', name: 'System', type: 'system' },
          payload: { status: 'idle', reason: 'Task completed successfully.' }
        }
        // Keep array bounded to 50 items for perf
        return [newEvent, ...prev].slice(0, 50)
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--surface-2)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="relative space-y-4 pl-4 before:absolute before:bottom-0 before:left-[35px] before:top-4 before:w-[2px] before:bg-gradient-to-b before:from-[var(--glass-border)] before:to-transparent">
      <AnimatePresence initial={false}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onClick={onSelectEvent}
            isActive={event.id === selectedEventId}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
