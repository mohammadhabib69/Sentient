"use client"

import * as React from "react"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-[var(--foreground-3)]/5 blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mb-4 text-6xl font-black text-[var(--surface-3)]">404</div>
        <EmptyState
          icon={FileQuestion}
          title="Page not found"
          description="The requested resource could not be found. It may have been moved, deleted, or you might not have access to it."
        />
        
        <div className="mt-6 flex justify-center">
          <Link href="/">
            <Button className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
