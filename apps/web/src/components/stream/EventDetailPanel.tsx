"use client"

import * as React from "react"
import { StreamEvent } from "@/types/event.types"
import {
  ExternalLink,
  FileText,
  LineChart,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EventDetailPanelProps {
  event: StreamEvent | null
  onClose: () => void
}

const RELATED_ENTITIES = [
  { label: "route_map_v2.json", icon: FileText },
  { label: "latency_metrics", icon: LineChart },
]

export function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  const initials = event?.display?.initials ?? "FL"
  const actorName = event?.actor.name.includes("Agent")
    ? event.actor.name
    : event
      ? `${event.actor.name}${event.actor.type === "agent" ? " Agent" : ""}`
      : "Flux Agent"
  const actorId =
    event?.actor.type === "agent"
      ? `ID: ${event.actor.id.toUpperCase().replace(/_/g, "-")}-ALPHA`
      : event
        ? `ID: ${event.actor.id}`
        : "ID: FLX-992-ALPHA"

  const payloadJson = event
    ? JSON.stringify(event.payload, null, 2)
    : `{
  "event_id": "evt_8832a1",
  "type": "suggestion",
  "target": "route_map_v2",
  "metrics": {
    "latency_reduction": "14%",
    "confidence": 0.92
  },
  "nodes_affected": [
    "n_441", "n_442", "n_489"
  ]
}`

  return (
    <aside className="hidden h-full w-[320px] shrink-0 flex-col overflow-y-auto custom-scrollbar border-l border-glass-border bg-surface-container-low/90 backdrop-blur-[28px] xl:flex">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-glass-border bg-surface-container-low/90 p-4 backdrop-blur-[28px]">
        <h3 className="text-[16px] font-semibold text-on-surface">Intelligence Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-on-surface-variant transition-colors hover:text-on-surface"
          aria-label="Close panel"
        >
          <X className="size-[18px]" />
        </button>
      </div>

      <div className="flex flex-col gap-6 p-4">
        <div>
          <span className="mb-2 block font-label-caps text-[10px] text-outline-variant">
            ACTOR METADATA
          </span>
          <div className="flex items-center gap-3 rounded-lg border border-glass-border bg-surface-container p-3">
            <div className="flex size-8 items-center justify-center rounded-full border border-mist-teal/30 bg-mist-teal/10 text-mist-teal">
              <span className="font-label-caps text-xs">{initials}</span>
            </div>
            <div>
              <div className="text-body-sm font-semibold text-on-surface">{actorName}</div>
              <div className="font-mono text-[10px] text-mist-teal">{actorId}</div>
            </div>
          </div>
        </div>

        <div>
          <span className="mb-2 block font-label-caps text-[10px] text-outline-variant">
            PAYLOAD DATA
          </span>
          <div className="overflow-x-auto rounded-lg border border-glass-border bg-surface-container-lowest p-3">
            <pre className="font-mono text-[11px] leading-relaxed text-secondary">
              <code>{payloadJson}</code>
            </pre>
          </div>
        </div>

        <div>
          <span className="mb-2 block font-label-caps text-[10px] text-outline-variant">
            RELATED ENTITIES
          </span>
          <div className="flex flex-col gap-2">
            {RELATED_ENTITIES.map((entity) => (
              <button
                key={entity.label}
                type="button"
                className="flex items-center justify-between rounded border border-glass-border bg-surface-container p-2 transition-colors hover:border-mist-teal/30"
              >
                <div className="flex items-center gap-2">
                  <entity.icon className="size-[14px] text-outline-variant" />
                  <span className="font-mono text-xs text-on-surface">{entity.label}</span>
                </div>
                <ExternalLink className="size-[14px] text-on-surface-variant" />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={cn(
            "mt-2 w-full rounded-lg border border-glass-border bg-surface-container py-2 text-body-sm text-on-surface transition-colors hover:bg-surface-container-high",
            !event && "opacity-60"
          )}
        >
          Execute Suggestion
        </button>

        {!event && (
          <p className="text-center text-body-sm text-on-surface-variant">
            Select an event from the live feed to inspect intelligence details.
          </p>
        )}
      </div>
    </aside>
  )
}
