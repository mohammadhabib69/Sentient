"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Download, Search, CheckCircle2 } from "lucide-react"

export default function MarketplacePage() {
  const plugins = [
    { name: "Jira Sync", author: "Sentient Inc.", desc: "Bi-directional sync between tasks and Jira tickets.", installed: true, icon: "J" },
    { name: "AWS Controller", author: "CloudWorks", desc: "Allow Dev agents to provision infrastructure via AWS API.", installed: false, icon: "A" },
    { name: "Salesforce CRM", author: "Sentient Inc.", desc: "Read and write lead data from Salesforce.", installed: false, icon: "S" },
    { name: "Notion Knowledge", author: "Community", desc: "Index Notion pages into agent RAG memory.", installed: true, icon: "N" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">Plugin Marketplace</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--foreground-3)]" />
          <input 
            type="text" 
            placeholder="Search plugins..." 
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-1)] py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[hsl(var(--primary))]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plugins.map((plugin, i) => (
          <div key={i} className="flex flex-col justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5 shadow-sm transition-all hover:bg-[var(--surface-2)]">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] text-lg font-bold text-foreground shadow-inner">
                  {plugin.icon}
                </div>
                {plugin.installed && (
                  <span className="flex items-center gap-1 rounded bg-[hsl(var(--primary))]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                    <CheckCircle2 className="size-3" /> Installed
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h4 className="font-bold text-foreground">{plugin.name}</h4>
                <p className="text-xs font-medium text-[hsl(var(--secondary))]">{plugin.author}</p>
                <p className="mt-2 text-sm text-[var(--foreground-2)] line-clamp-2">{plugin.desc}</p>
              </div>
            </div>
            
            <div className="mt-6">
              {!plugin.installed ? (
                <Button variant="outline" className="w-full flex gap-2">
                  <Download className="size-4" /> Install Plugin
                </Button>
              ) : (
                <Button variant="outline" className="w-full border-[var(--glass-border)] hover:bg-[var(--red)]/10 hover:text-[var(--red)] hover:border-[var(--red)]/20 text-[var(--foreground-3)]">
                  Uninstall
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
