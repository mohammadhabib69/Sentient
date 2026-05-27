import { LandingHero } from "@/components/marketing/LandingHero"
import { AgentShowcase } from "@/components/marketing/Showcase"
import { StreamPreview } from "@/components/marketing/StreamPreview"
import { PricingSection } from "@/components/marketing/PricingSection"
import { SiteFooter } from "@/components/marketing/SiteFooter"

function ProblemSolutionSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-container-max gap-6 px-gutter lg:grid-cols-2">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground">Before Sentient</h3>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            Siloed teams, delayed approvals, fragmented event trails, and manual coordination across systems.
          </p>
        </div>
        <div className="glass-panel rounded-xl border-primary/40 p-6">
          <h3 className="text-lg font-semibold text-foreground">With Sentient</h3>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            Unified visibility, autonomous actions with approvals, and real-time operational context in one command center.
          </p>
        </div>
      </div>
    </section>
  )
}

export default function MarketingPage() {
  return (
    <div className="flex flex-col">
      <LandingHero />
      <AgentShowcase />
      <StreamPreview />
      <ProblemSolutionSection />
      <PricingSection />
      <SiteFooter />
    </div>
  )
}
