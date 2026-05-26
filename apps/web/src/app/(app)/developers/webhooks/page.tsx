"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus, Webhook, Activity, Settings } from "lucide-react"

export default function WebhooksPage() {
  const webhooks = [
    { url: "https://api.acme.com/sentient/events", events: ["agent.action_completed", "task.status_changed"], active: true },
    { url: "https://hooks.slack.com/services/T000...", events: ["anomaly.detected", "agent.error"], active: true },
    { url: "https://zapier.com/hooks/catch/12345", events: ["*"], active: false },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Webhooks</h2>
        <Button className="flex items-center gap-2 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">
          <Plus className="size-4" /> Add Endpoint
        </Button>
      </div>

      <div className="grid gap-4">
        {webhooks.map((hook, i) => (
          <div key={i} className="flex flex-col justify-between gap-4 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-3)] text-[var(--foreground-2)]">
                <Webhook className="size-4" />
              </div>
              <div>
                <h4 className="font-mono text-sm text-foreground break-all">{hook.url}</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hook.events.map(e => (
                    <span key={e} className="rounded border border-[var(--glass-border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--foreground-2)]">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex shrink-0 items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`flex size-2 rounded-full ${hook.active ? 'bg-[var(--green)]' : 'bg-[var(--foreground-3)]'}`} />
                <span className="text-xs font-medium text-[var(--foreground-2)]">{hook.active ? 'Active' : 'Disabled'}</span>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 text-[var(--foreground-3)] hover:text-foreground">
                  <Activity className="size-4" />
                </button>
                <button className="p-1.5 text-[var(--foreground-3)] hover:text-foreground">
                  <Settings className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
