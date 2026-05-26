"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, Plus, X } from "lucide-react"

export default function TeamSetupPage() {
  const router = useRouter()
  const [emails, setEmails] = React.useState([''])

  const addEmail = () => setEmails([...emails, ''])
  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-8 shadow-xl">
      <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
        <Users className="size-6" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground">Invite your team</h2>
      <p className="mt-2 text-sm text-[var(--foreground-3)]">
        Sentient works best when your whole team is collaborating with agents.
      </p>

      <div className="mt-8 space-y-4">
        {emails.map((email, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => {
                const newEmails = [...emails]
                newEmails[i] = e.target.value
                setEmails(newEmails)
              }}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))]"
            />
            {emails.length > 1 && (
              <button onClick={() => removeEmail(i)} className="p-2 text-[var(--foreground-3)] hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}

        <button onClick={addEmail} className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--primary))] hover:underline">
          <Plus className="size-4" /> Add another
        </button>

        <div className="flex items-center gap-3 pt-6">
          <Button onClick={() => router.push('/onboarding/workspace')} className="flex-1 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">
            Send Invites
          </Button>
          <Button onClick={() => router.push('/onboarding/workspace')} variant="outline" className="flex-1">
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
