"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Zap } from "lucide-react"

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Billing & Plans</h2>
        <p className="text-sm text-[var(--foreground-3)]">Manage your subscription and usage limits.</p>
      </div>

      {/* Current Plan Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-6 shadow-sm">
        
        {/* Background decorative gradient */}
        <div className="absolute right-0 top-0 size-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-[hsl(var(--primary))]/10 blur-[60px] pointer-events-none" />

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-foreground">Pro Plan</h3>
              <span className="rounded-full bg-[hsl(var(--primary))]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20">
                Active
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--foreground-2)]">
              Next billing cycle on June 1st, 2026. <span className="font-semibold text-foreground">$149.00/mo</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline">View Invoices</Button>
            <Button className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">Upgrade Plan</Button>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--glass-border)] pt-6">
          <h4 className="font-semibold text-foreground mb-4">Current Usage</h4>
          <div className="grid gap-6 sm:grid-cols-2">
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--foreground-2)]">Agent Actions</span>
                <span className="font-medium text-foreground">42,500 / 100,000</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div className="h-full w-[42.5%] bg-[hsl(var(--primary))]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--foreground-2)]">Storage Used</span>
                <span className="font-medium text-foreground">18 GB / 50 GB</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div className="h-full w-[36%] bg-[hsl(var(--secondary))]" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
