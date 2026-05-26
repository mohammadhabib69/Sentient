"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"

export default function OrgSetupPage() {
  const router = useRouter()

  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-8 shadow-xl">
      <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
        <Building2 className="size-6" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground">Tell us about your organization</h2>
      <p className="mt-2 text-sm text-[var(--foreground-3)]">
        This helps us tailor Sentient's agent configurations for your industry.
      </p>

      <div className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground-2)]">Organization Name</label>
          <input
            type="text"
            placeholder="Acme Corp"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--foreground-2)]">Industry</label>
            <select className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))]">
              <option>Technology</option>
              <option>Finance</option>
              <option>Healthcare</option>
              <option>Retail</option>
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--foreground-2)]">Team Size</label>
            <select className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))]">
              <option>1-10</option>
              <option>11-50</option>
              <option>51-200</option>
              <option>201+</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={() => router.push('/onboarding/team')} className="w-full text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
            Continue to Team Setup
          </Button>
        </div>
      </div>
    </div>
  )
}
