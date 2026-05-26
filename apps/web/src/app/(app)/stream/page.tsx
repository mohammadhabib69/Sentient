"use client"

import * as React from "react"
import { StreamTimeline } from "@/components/stream/StreamTimeline"
import { StreamFilters } from "@/components/stream/StreamFilters"
import { EventDetailPanel } from "@/components/stream/EventDetailPanel"
import { StreamEvent } from "@/types/event.types"
import { Activity } from "lucide-react"
import { PageTransition } from "@/components/shared/PageTransition"

export default function StreamPage() {
  const [selectedEvent, setSelectedEvent] = React.useState<StreamEvent | null>(null)

  return (
    <PageTransition className="flex h-[calc(100vh-100px)] flex-col gap-6 relative overflow-hidden">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <Activity className="size-6 text-[hsl(var(--primary))]" />
          Reality Stream
        </h1>
        <p className="text-sm text-[var(--foreground-2)] mt-1">
          Live immutable ledger of all system, agent, and user events.
        </p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Filters Panel */}
        <div className="hidden w-64 shrink-0 lg:block">
          <StreamFilters />
        </div>

        {/* Center Timeline */}
        <div className="flex-1 overflow-y-auto pr-4 pb-20 scrollbar-hide">
          <StreamTimeline 
            onSelectEvent={setSelectedEvent} 
            selectedEventId={selectedEvent?.id} 
          />
        </div>
      </div>

      {/* Right Slide-out Panel */}
      <EventDetailPanel 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </PageTransition>
  )
}
