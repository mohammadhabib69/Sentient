import * as React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authenticate - Sentient",
  description: "Sign in to Sentient",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Subtle decorative radial glow blobs in the background */}
      <div className="absolute left-1/3 top-1/3 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--primary))]/8 opacity-40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 size-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-[hsl(var(--secondary))]/8 opacity-40 blur-[120px] pointer-events-none" />
      
      {/* Centered content container - supports 480px cards */}
      <div className="relative z-10 w-full max-w-[480px] px-4 sm:px-6 py-12">
        {children}
      </div>
    </div>
  )
}
