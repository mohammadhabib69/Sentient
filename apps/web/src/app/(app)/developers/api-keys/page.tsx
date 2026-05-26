"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus, Key, MoreHorizontal, Trash2 } from "lucide-react"

export default function ApiKeysPage() {
  const keys = [
    { name: "Production App V2", type: "Secret Key", prefix: "sk_live_...", created: "May 10, 2026", lastUsed: "2 mins ago" },
    { name: "Staging Environment", type: "Publishable Key", prefix: "pk_test_...", created: "Apr 22, 2026", lastUsed: "1 day ago" },
    { name: "Zapier Integration", type: "Secret Key", prefix: "sk_live_...", created: "Mar 15, 2026", lastUsed: "5 hours ago" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
        <Button className="flex items-center gap-2 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">
          <Plus className="size-4" /> Create New Key
        </Button>
      </div>

      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--glass-border)] bg-[var(--surface-2)]">
            <tr>
              <th className="px-6 py-3 font-medium text-[var(--foreground-2)]">Name</th>
              <th className="px-6 py-3 font-medium text-[var(--foreground-2)]">Key Prefix</th>
              <th className="px-6 py-3 font-medium text-[var(--foreground-2)]">Created</th>
              <th className="px-6 py-3 font-medium text-[var(--foreground-2)]">Last Used</th>
              <th className="px-6 py-3 font-medium text-[var(--foreground-2)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--glass-border)]">
            {keys.map((key, i) => (
              <tr key={i} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Key className="size-4 text-[var(--foreground-3)]" />
                    <div>
                      <div className="font-medium text-foreground">{key.name}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-3)]">{key.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-[var(--foreground-2)]">{key.prefix}</td>
                <td className="px-6 py-4 text-[var(--foreground-2)]">{key.created}</td>
                <td className="px-6 py-4 text-[var(--foreground-2)]">{key.lastUsed}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-[var(--foreground-3)] hover:text-[var(--red)] transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                    <button className="p-1.5 text-[var(--foreground-3)] hover:text-foreground">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--foreground-2)]">
        <strong>Security Notice:</strong> Secret keys grant extensive access to your organization. Never commit them to public repositories.
      </div>
    </div>
  )
}
