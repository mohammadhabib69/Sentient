"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"

export default function TeamSetupPage() {
  const router = useRouter()
  const [inputEmail, setInputEmail] = React.useState("")
  const [emails, setEmails] = React.useState<string[]>([])

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputEmail.trim()
    if (trimmed && !emails.includes(trimmed)) {
      setEmails([...emails, trimmed])
      setInputEmail("")
    }
  }

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email))
  }

  const handleContinue = () => {
    // Go to step 3
    router.push('/onboarding/workspace')
  }

  return (
    <div className="glass-panel rounded-[20px] p-8 shadow-[var(--shadow-card)] space-y-6">
      <div className="space-y-1">
        <span className="text-[11px] font-bold tracking-widest uppercase text-primary">
          STEP 2 OF 5
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Invite your team
        </h2>
        <p className="text-sm text-[var(--foreground-2)]">
          Agents work better when they know your team
        </p>
      </div>

      <div className="space-y-4">
        {/* Email invite input row */}
        <form onSubmit={handleAddEmail} className="flex gap-2">
          <input
            type="email"
            placeholder="colleague@company.com"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            className="flex-1 h-11 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
          <button 
            type="submit"
            className="h-11 px-5 border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="size-4" /> Add
          </button>
        </form>

        {/* Added emails list/chips */}
        {emails.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {emails.map((email) => (
              <div 
                key={email}
                className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--surface-2)] pl-3 pr-2 py-1 text-xs text-[var(--foreground-2)]"
              >
                <span>{email}</span>
                <button 
                  onClick={() => handleRemoveEmail(email)}
                  className="p-0.5 rounded-full hover:bg-[var(--surface-3)] hover:text-foreground transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Skip link */}
        <div className="pt-2">
          <button 
            onClick={handleContinue}
            className="text-sm font-medium text-[var(--foreground-2)] hover:text-foreground hover:underline transition-colors font-mono"
          >
            Skip for now &rarr;
          </button>
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <Button 
          onClick={handleContinue}
          className="w-full h-11 bg-primary hover:brightness-110 text-white font-semibold rounded-lg flex items-center justify-center transition-all"
        >
          Continue &rarr;
        </Button>
        
        <div className="text-center text-xs text-[var(--foreground-3)] font-mono">
          2 of 5
        </div>
      </div>
    </div>
  )
}
