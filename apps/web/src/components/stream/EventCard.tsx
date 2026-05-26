"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { StreamEvent } from "@/types/event.types"
import { Bot, User, Cpu, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventCardProps {
  event: StreamEvent
  onClick: (event: StreamEvent) => void
  isActive: boolean
}

export function EventCard({ event, onClick, isActive }: EventCardProps) {
  const isError = event.type === 'webhook_failed' || event.type === 'error'
  const isAgent = event.actor.type === 'agent'
  const isUser = event.actor.type === 'user'

  const Icon = isError ? AlertTriangle : isAgent ? Bot : isUser ? User : Cpu
  
  const borderColors = {
    error: "border-l-[var(--red)]",
    user: "border-l-[hsl(var(--primary))]",
    agent: "border-l-[hsl(var(--secondary))]",
    system: "border-l-[var(--foreground-3)]",
  }

  const borderClass = isError ? borderColors.error : 
                      isUser ? borderColors.user : 
                      isAgent ? borderColors.agent : 
                      borderColors.system

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(event)}
      className={cn(
        "relative flex cursor-pointer gap-4 rounded-xl border border-l-4 bg-[var(--surface-1)] p-4 shadow-sm transition-all hover:bg-[var(--surface-2)]",
        borderClass,
        isActive ? "ring-2 ring-[hsl(var(--primary))]/50 bg-[var(--surface-2)]" : "border-y-[var(--glass-border)] border-r-[var(--glass-border)]"
      )}
    >
      <div className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)]",
        isError ? "text-[var(--red)] bg-[var(--red)]/10" : 
        isAgent ? "text-[hsl(var(--secondary))] bg-[hsl(var(--secondary))]/10" : 
        isUser ? "text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10" : 
        "text-[var(--foreground-2)]"
      )}>
        <Icon className="size-5" />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {event.actor.name} <span className="font-normal text-[var(--foreground-3)]">{event.type.replace(/_/g, ' ')}</span>
          </p>
          <span className="text-xs text-[var(--foreground-3)]">
            {new Date(event.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        
        {/* Preview Payload Snippet */}
        <p className="mt-1 truncate text-xs text-[var(--foreground-2)]">
          {JSON.stringify(event.payload).substring(0, 100)}...
        </p>
      </div>
    </motion.div>
  )
}
