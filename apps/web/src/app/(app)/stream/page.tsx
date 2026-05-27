"use client"

import * as React from "react"
import { Download, Pause } from "lucide-react"
import { PageTransition } from "@/components/shared/PageTransition"
import { StreamFilters } from "@/components/stream/StreamFilters"
import { StreamTimeline } from "@/components/stream/StreamTimeline"
import { EventDetailPanel } from "@/components/stream/EventDetailPanel"
import { StreamCommandBar } from "@/components/stream/StreamCommandBar"
import { StreamEvent } from "@/types/event.types"
import { useStreamEvents } from "@/hooks/useStream"

export default function RealityStreamPage() {
  const { data: events = [] } = useStreamEvents()
  const [selectedEvent, setSelectedEvent] = React.useState<StreamEvent | null>(null)

  React.useEffect(() => {
    if (!selectedEvent && events[0]) {
      setSelectedEvent(events[0])
    }
  }, [events, selectedEvent])

  return (
    <PageTransition className="-mx-6 -my-6 flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row overflow-hidden">
        <StreamFilters />

        <section className="z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-glass-border bg-surface-container/80 px-6 py-4 backdrop-blur-[28px]">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-bold text-on-surface">Live Feed</h2>
              <div className="flex items-center gap-2 rounded-full border border-forest-green/20 bg-forest-green/10 px-2 py-0.5">
                <span className="size-2 animate-pulse rounded-full bg-forest-green shadow-[0_0_8px_rgba(73,119,107,0.8)]" />
                <span className="font-label-caps text-label-caps text-forest-green">LIVE</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-white/5"
                aria-label="Pause feed"
              >
                <Pause className="size-4" />
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-white/5"
                aria-label="Download feed"
              >
                <Download className="size-4" />
              </button>
            </div>
          </div>

          <div className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto p-6 pb-32">
            <div className="absolute bottom-0 left-[47px] top-4 hidden w-px bg-surface-variant/50 sm:block" />
            <StreamTimeline
              onSelectEvent={setSelectedEvent}
              selectedEventId={selectedEvent?.id}
            />
          </div>
        </section>

        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </div>

      <StreamCommandBar />
    </PageTransition>
  )
}
