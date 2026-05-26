"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { StreamEvent } from "@/types/event.types"
import { X, Box, Activity, Clock } from "lucide-react"

interface EventDetailPanelProps {
  event: StreamEvent | null
  onClose: () => void
}

export function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 right-0 top-[56px] z-40 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--surface-1)] shadow-2xl sm:w-96"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
              <h3 className="font-semibold text-foreground">Event Details</h3>
              <button 
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--foreground-3)] transition-colors hover:bg-[var(--surface-2)] hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Header Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-2)]">
                  <Activity className="size-4" />
                  <span className="font-medium text-foreground capitalize">{event.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-3)]">
                  <Clock className="size-4" />
                  {new Date(event.occurredAt).toLocaleString()}
                </div>
              </div>

              {/* Actor Info */}
              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-3)]">Actor</h4>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[var(--surface-3)]" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{event.actor.name}</p>
                    <p className="text-xs capitalize text-[var(--foreground-3)]">{event.actor.type}</p>
                  </div>
                </div>
              </div>

              {/* Aggregate Target */}
              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-3)]">Target Resource</h4>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Box className="size-4 text-[var(--foreground-3)]" />
                  <span className="capitalize">{event.aggregateType}:</span>
                  <span className="font-mono text-xs">{event.aggregateId}</span>
                </div>
              </div>

              {/* Payload Data */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-3)]">Payload Data</h4>
                <div className="rounded-lg border border-[var(--glass-border)] bg-[#1e1e1e] p-4 font-mono text-xs text-[#d4d4d4] overflow-x-auto">
                  <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
