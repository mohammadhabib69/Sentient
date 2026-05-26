"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, Code2, Network, Blocks } from "lucide-react"

export default function DevelopersOverviewPage() {
  const guides = [
    { title: "API Reference", description: "Complete documentation for the Sentient REST API.", icon: BookOpen },
    { title: "Authentication", description: "Learn how to authenticate your API requests.", icon: Code2 },
    { title: "Webhooks Guide", description: "Set up real-time event subscriptions.", icon: Network },
    { title: "Agent SDKs", description: "Build custom capabilities for your agents.", icon: Blocks },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--glass-border)] bg-[hsl(var(--primary))]/5 p-8 text-center backdrop-blur-md">
        <h2 className="text-xl font-bold text-foreground">Welcome to the Developer Platform</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--foreground-2)]">
          Integrate Sentient Engine directly into your infrastructure. Automate workflows programmatically, react to agent events in real-time, and expand capabilities via custom plugins.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">
            Generate API Key
          </Button>
          <Button variant="outline">Read the Docs</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Getting Started Guides</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((guide, i) => {
            const Icon = guide.icon
            return (
              <div key={i} className="group flex cursor-pointer gap-4 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5 transition-all hover:bg-[var(--surface-2)] hover:border-[var(--foreground-3)]">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-3)] text-[var(--foreground-2)] transition-colors group-hover:bg-[hsl(var(--primary))]/10 group-hover:text-[hsl(var(--primary))]">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{guide.title}</h4>
                  <p className="mt-1 text-sm text-[var(--foreground-3)]">{guide.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
