const PREVIEW_EVENTS = [
  "Flux approved deployment guardrail update",
  "Nova flagged billing anomaly in workspace Engineering",
  "Aria rebalanced sprint assignments",
  "Echo resolved 12 customer issues automatically",
  "System checkpoint created for release candidate",
]

export function StreamPreview() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-container-max px-gutter">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-headline-2xl text-foreground">Reality Stream Preview</h2>
          <p className="mt-4 text-body-lg text-on-surface-variant">
            Live event flow across agents, users, and systems.
          </p>
        </div>

        <div className="glass-panel mx-auto max-w-4xl rounded-2xl p-6">
          <div className="space-y-3">
            {PREVIEW_EVENTS.map((event) => (
              <div
                key={event}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
              >
                {event}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
