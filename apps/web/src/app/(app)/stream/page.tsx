"use client"

import * as React from "react"
import { PageTransition } from "@/components/shared/PageTransition"
import { StreamFilters } from "@/components/stream/StreamFilters"
import { StreamTimeline } from "@/components/stream/StreamTimeline"
import { EventDetailPanel } from "@/components/stream/EventDetailPanel"
import { StreamEvent } from "@/types/event.types"

export default function RealityStreamPage() {
  const [selectedEvent, setSelectedEvent] = React.useState<StreamEvent | null>(null)

  return (
    <PageTransition className="flex h-[calc(100vh-80px)] flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Reality Stream</h1>
          <p className="text-[13px] text-[var(--foreground-2)]">
            Every action, every decision - immutable and live
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-forest-green/20 bg-forest-green/5 px-3 py-1 text-forest-green">
          <span className="status-pulse inline-block size-2 rounded-full bg-forest-green" />
          <span className="font-mono text-xs font-semibold tracking-wider">LIVE</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-6 overflow-hidden">
        <div className="hidden w-[260px] shrink-0 md:block">
          <StreamFilters />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-2">
          <StreamTimeline
            onSelectEvent={setSelectedEvent}
            selectedEventId={selectedEvent?.id}
          />
        </div>
      </div>

      <EventDetailPanel
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </PageTransition>
  )
}
