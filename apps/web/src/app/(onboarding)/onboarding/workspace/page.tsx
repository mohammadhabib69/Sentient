"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Layout } from "lucide-react"

export default function WorkspaceSetupPage() {
  const router = useRouter()

  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-8 shadow-xl">
      <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-[hsl(var(--secondary))]/10 text-[hsl(var(--secondary))]">
        <Layout className="size-6" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground">Create your first workspace</h2>
      <p className="mt-2 text-sm text-[var(--foreground-3)]">
        Workspaces isolate projects, agents, and data for different teams or domains.
      </p>

      <div className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground-2)]">Workspace Name</label>
          <input
            type="text"
            defaultValue="Engineering"
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--secondary))]"
          />
        </div>

        <div className="pt-4">
          <Button onClick={() => router.push('/onboarding/agents')} className="w-full bg-[hsl(var(--secondary))] text-white hover:bg-[hsl(var(--secondary))]/90">
            Create Workspace
          </Button>
        </div>
      </div>
    </div>
  )
}
