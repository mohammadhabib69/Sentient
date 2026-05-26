"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Terminal } from "lucide-react"

const TABS = [
  { href: "/developers", label: "Overview" },
  { href: "/developers/api-keys", label: "API Keys" },
  { href: "/developers/webhooks", label: "Webhooks" },
  { href: "/developers/marketplace", label: "Marketplace" },
]

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col relative overflow-hidden pb-10">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <Terminal className="size-6 text-[hsl(var(--primary))]" />
          Developer Portal
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground-2)]">
          Build integrations, manage API keys, and configure webhooks.
        </p>
      </div>

      <div className="mb-8 border-b border-[var(--glass-border)]">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "border-b-2 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                    : "border-transparent text-[var(--foreground-2)] hover:border-[var(--glass-border)] hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
        {children}
      </div>
    </div>
  )
}
