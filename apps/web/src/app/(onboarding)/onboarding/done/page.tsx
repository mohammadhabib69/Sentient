"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import confetti from "canvas-confetti"

export default function DoneSetupPage() {
  const router = useRouter()

  React.useEffect(() => {
    const end = Date.now() + 3 * 1000
    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b']

    ;(function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      })
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }())
  }, [])

  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-8 shadow-xl text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
        <Sparkles className="size-8" />
      </div>
      
      <h2 className="text-3xl font-bold text-foreground">You're all set!</h2>
      <p className="mt-3 text-sm text-[var(--foreground-3)] leading-relaxed">
        Your workspace is configured, agents are deployed, and your team is ready to collaborate with AI.
      </p>

      <div className="pt-8">
        <Button 
          onClick={() => router.push('/dashboard')} 
          size="lg"
          className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90"
        >
          Enter Workspace
        </Button>
      </div>
    </div>
  )
}
