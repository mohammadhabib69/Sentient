"use client"

export function GraphLegend() {
  const items = [
    { label: "Projects", className: "rounded bg-primary border border-primary/50 shadow-[0_0_8px_rgba(170,204,211,0.5)]" },
    { label: "AI Agents", className: "rounded-full bg-forest-green" },
    { label: "Tasks", className: "rounded-full bg-mist-teal" },
    { label: "Users", className: "rounded-full bg-secondary" },
    { label: "Critical Issue", className: "rounded-full bg-error-red graph-pulse-error", isCritical: true },
  ] as const

  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-40 flex flex-col gap-3 rounded-xl border border-glass-border bg-surface-container-high/60 p-4 shadow-2xl backdrop-blur-xl">
      <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        Network Legend
      </span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className={`size-3 ${item.className}`} />
          <span
            className={`font-mono text-xs ${"isCritical" in item && item.isCritical ? "text-error-red" : "text-on-surface"}`}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
