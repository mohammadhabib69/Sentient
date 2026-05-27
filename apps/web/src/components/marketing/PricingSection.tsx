const PLANS = [
  { name: "Starter", price: "$0", description: "For teams exploring autonomous workflows." },
  { name: "Pro", price: "$99", description: "Production-ready automation for growing companies.", featured: true },
  { name: "Business", price: "$299", description: "Advanced governance and multi-workspace control." },
  { name: "Enterprise", price: "Custom", description: "Dedicated infrastructure, SSO, and priority support." },
]

export function PricingSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-container-max px-gutter">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-headline-2xl text-foreground">Pricing</h2>
          <p className="mt-4 text-body-lg text-on-surface-variant">
            Scale from pilot to enterprise operations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={[
                "glass-panel rounded-xl p-6",
                plan.featured ? "border-primary shadow-[0_0_20px_rgba(116,149,155,0.2)] lg:-translate-y-2" : "",
              ].join(" ")}
            >
              <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-3 font-mono text-2xl font-bold text-mist-teal">{plan.price}</p>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{plan.description}</p>
              <button className="mt-6 inline-flex h-10 items-center rounded-full border border-outline-variant px-5 text-sm font-medium text-foreground transition hover:bg-surface-container">
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
