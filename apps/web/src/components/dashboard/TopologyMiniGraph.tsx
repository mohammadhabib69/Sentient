import Link from "next/link"
import { GitFork, Maximize2 } from "lucide-react"

export function TopologyMiniGraph() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)]">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <GitFork className="size-4" />
          Network Topology
        </h2>
        <Link 
          href="/graph" 
          className="rounded p-1 text-[var(--foreground-3)] transition-colors hover:bg-[var(--surface-2)] hover:text-foreground"
        >
          <Maximize2 className="size-4" />
        </Link>
      </div>
      
      {/* Fake miniature graph nodes for visual parity */}
      <div className="relative flex-1 bg-[url('/grid-pattern.svg')] bg-[length:24px_24px] p-6 opacity-80">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] to-transparent" />
        
        {/* Central Node */}
        <div className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[hsl(var(--primary))]/50 bg-[hsl(var(--primary))]/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <div className="size-4 rounded-full bg-[hsl(var(--primary))]" />
        </div>
        
        {/* Satellite Node 1 */}
        <div className="absolute left-1/4 top-1/3 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--amber)]/50 bg-[var(--amber)]/20">
          <div className="size-2 rounded-full bg-[var(--amber)]" />
        </div>

        {/* Satellite Node 2 */}
        <div className="absolute left-3/4 top-1/4 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--green)]/50 bg-[var(--green)]/20">
          <div className="size-2 rounded-full bg-[var(--green)]" />
        </div>

        {/* Lines (SVG) */}
        <svg className="absolute inset-0 size-full pointer-events-none" style={{ zIndex: 0 }}>
          <line x1="50%" y1="50%" x2="25%" y2="33%" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
      </div>
    </div>
  )
}
