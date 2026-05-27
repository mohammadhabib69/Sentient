"use client"

import { Terminal } from "lucide-react"

export function GraphCommandBar() {
  return (
    <div className="pointer-events-auto absolute bottom-8 left-1/2 z-40 w-[32rem] max-w-[90vw] -translate-x-1/2">
      <div className="flex items-center rounded-2xl border border-glass-border bg-surface-container-highest/80 px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 focus-within:border-mist-teal/70 focus-within:ring-2 focus-within:ring-mist-teal/20">
        <Terminal className="mr-3 size-6 shrink-0 text-mist-teal" />
        <input
          type="text"
          placeholder="Query network (e.g., /isolate bottlenecks, /spawn agent)..."
          className="h-8 w-full border-none bg-transparent font-mono text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-0"
        />
        <div className="ml-3 flex shrink-0 items-center gap-1.5 opacity-60">
          <kbd className="rounded-md border border-outline-variant/60 bg-surface-container px-2 py-1 font-mono text-[11px] text-on-surface-variant shadow-sm">
            ⌘
          </kbd>
          <kbd className="rounded-md border border-outline-variant/60 bg-surface-container px-2 py-1 font-mono text-[11px] text-on-surface-variant shadow-sm">
            K
          </kbd>
        </div>
      </div>
    </div>
  )
}
