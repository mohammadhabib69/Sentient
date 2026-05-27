"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { useStreamEvents } from "@/hooks/useStream";
import { StreamEvent } from "@/types/event.types";
import { EventCard } from "@/components/stream/EventCard";

interface StreamTimelineProps {
  onSelectEvent: (event: StreamEvent) => void;
  selectedEventId?: string;
}

export function StreamTimeline({ onSelectEvent, selectedEventId }: StreamTimelineProps) {
  const { data: initialEvents = [], isLoading } = useStreamEvents();
  const [events, setEvents] = React.useState<StreamEvent[]>([]);

  React.useEffect(() => {
    if (initialEvents.length > 0) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => {
        const newEvent: StreamEvent = {
          id: `sim_evt_${Date.now()}`,
          type: "agent_status_changed",
          aggregateId: "agt_simulate",
          aggregateType: "agent",
          occurredAt: new Date().toISOString(),
          actor: { id: "sys_1", name: "System", type: "system" },
          payload: { status: "idle", reason: "Task completed successfully." },
          display: {
            variant: "suggestion",
            badge: "UPDATE",
            description: "Agent status changed — task completed successfully.",
            resourceLabel: "agt_simulate",
            actionLabel: "View Details",
            initials: "SY",
          },
        };
        return [newEvent, ...prev].slice(0, 50);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-container" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-4">
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
  );
}
