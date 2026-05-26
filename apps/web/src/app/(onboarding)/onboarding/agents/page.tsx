"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AgentsSetupPage() {
  const router = useRouter()
  const [selected, setSelected] = React.useState<string[]>(['ops', 'dev'])

  const agents = [
    { id: 'ops', name: 'Aria', role: 'Operations', color: 'var(--primary)' },
    { id: 'dev', name: 'Flux', role: 'Development', color: 'var(--amber)' },
    { id: 'fin', name: 'Nova', role: 'Finance', color: 'var(--green)' },
    { id: 'cust', name: 'Echo', role: 'Customer Success', color: 'var(--secondary)' },
  ]

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-8 shadow-xl">
      <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-[var(--amber)]/10 text-[var(--amber)]">
        <Bot className="size-6" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground">Deploy Initial Agents</h2>
      <p className="mt-2 text-sm text-[var(--foreground-3)]">
        Select which AI agents you want to activate in your workspace immediately.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {agents.map((agent) => {
          const isSelected = selected.includes(agent.id)
          return (
            <div
              key={agent.id}
              onClick={() => toggle(agent.id)}
              className={cn(
                "cursor-pointer rounded-xl border p-4 transition-all hover:bg-[var(--surface-2)]",
                isSelected ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-sm" : "border-[var(--glass-border)] bg-[var(--surface-1)]"
              )}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="flex size-8 items-center justify-center rounded-full" 
                  style={{ backgroundColor: `color-mix(in srgb, ${agent.color} 15%, transparent)`, color: `hsl(${agent.color})` }}
                >
                  <Bot className="size-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{agent.name}</h4>
                  <p className="text-xs text-[var(--foreground-3)]">{agent.role}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-8">
        <Button 
          onClick={() => router.push('/onboarding/done')} 
          disabled={selected.length === 0}
          className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90"
        >
          Deploy Agents & Continue
        </Button>
      </div>
    </div>
  )
}
