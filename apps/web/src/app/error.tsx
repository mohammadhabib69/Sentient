"use client"

import * as React from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("Global Error Caught:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-[var(--red)]/5 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description={error.message || "An unexpected error occurred in the Sentient Engine. Our agents have been notified."}
          actionLabel="Try again"
          onAction={() => reset()}
          className="border-[var(--red)]/20"
        />
        
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
