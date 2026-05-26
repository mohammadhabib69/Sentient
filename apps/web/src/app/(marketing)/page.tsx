import { LandingHero } from "@/components/marketing/LandingHero"
import { AgentShowcase } from "@/components/marketing/Showcase"
import { SiteFooter } from "@/components/marketing/SiteFooter"

export default function MarketingPage() {
  return (
    <div className="flex flex-col">
      <LandingHero />
      <AgentShowcase />
      <SiteFooter />
    </div>
  )
}
