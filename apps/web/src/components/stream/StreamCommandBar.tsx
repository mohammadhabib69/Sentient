"use client"

import { Terminal } from "lucide-react"

export function StreamCommandBar() {
  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 w-[90%] max-w-[600px] -translate-x-1/2 md:left-[calc(50%+136px)]">
      <div className="pointer-events-auto rounded-full border border-glass-border bg-surface-container/90 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[28px]">
        <div className="flex items-center rounded-full border border-glass-border bg-surface-dim px-5 py-2.5 transition-all focus-within:ring-1 focus-within:ring-mist-teal">
          <Terminal className="mr-3 size-[18px] text-mist-teal" />
          <input
            type="text"
            placeholder="Command Terminal | Type '/' for commands..."
            className="w-full border-none bg-transparent font-mono text-mono-xs text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-0"
          />
          <button
            type="button"
            className="ml-2 shrink-0 rounded-full border border-forest-green/30 bg-forest-green/20 px-4 py-1 text-label-caps text-forest-green transition-colors hover:bg-forest-green hover:text-white"
          >
            EXEC
          </button>
        </div>
      </div>
    </div>
  )
}
