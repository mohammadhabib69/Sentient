"use client"

const AGENTS = [
  {
    name: "Aria",
    initials: "AR",
    role: "Operations",
    color: "#74959B",       // mist-teal
    borderClass: "border-t-mist-teal",
    description:
      "Optimizing resource allocation and workflow throughput globally.",
    terminal: "> Rebalancing load balancer config... done.",
  },
  {
    name: "Nova",
    initials: "NV",
    role: "Finance",
    color: "#D4874A",       // amber-alert
    borderClass: "border-t-amber-alert",
    description:
      "Real-time market analysis and automated portfolio hedging.",
    terminal: "> Analyzing Q3 predictive models... confident.",
  },
  {
    name: "Echo",
    initials: "EC",
    role: "Customer",
    color: "#49776B",       // forest-green
    borderClass: "border-t-forest-green",
    description:
      "Sentiment analysis and automated tier-1 support resolution.",
    terminal: "> Resolving ticket #8942... successful.",
  },
  {
    name: "Flux",
    initials: "FX",
    role: "Development",
    color: "#aaccd3",       // primary blue
    borderClass: "border-t-[#aaccd3]",
    description:
      "Continuous integration monitoring and automated bug patching.",
    terminal: "> Patching vulnerability in core-v2... deployed.",
  },
] as const

export function AgentShowcase() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-container-max px-gutter">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-headline-2xl text-foreground">
            Active Intelligence Roster
          </h2>
          <p className="mt-4 text-body-lg text-on-surface-variant">
            Specialized agents operating autonomously across functional domains.
          </p>
        </div>

        {/* Agent grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((agent) => (
            <div
              key={agent.name}
              className={`glass-panel rounded-xl border-t-2 ${agent.borderClass} p-6 transition-colors hover:brightness-105`}
            >
              {/* Avatar + status */}
              <div className="relative mb-4 inline-flex">
                <div
                  className="flex size-12 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: `${agent.color}20`,
                    color: agent.color,
                  }}
                >
                  {agent.initials}
                </div>
                {/* Pulsing green status dot */}
                <span
                  className="status-pulse absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface-container bg-forest-green text-forest-green"
                />
              </div>

              {/* Name & role */}
              <h3 className="text-base font-bold text-foreground">
                {agent.name}
              </h3>
              <p
                className="mt-0.5 text-label-caps uppercase"
                style={{ color: agent.color }}
              >
                {agent.role}
              </p>

              {/* Description */}
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                {agent.description}
              </p>

              {/* Terminal preview */}
              <div className="mt-4 rounded-md bg-surface-container-lowest px-3 py-2">
                <p className="font-mono text-mono-xs text-mist-teal">
                  {agent.terminal}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
