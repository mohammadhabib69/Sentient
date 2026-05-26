import * as React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authenticate - Sentient",
  description: "Sign in to Sentient",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[url('/bg-mesh.jpg')] bg-cover bg-center bg-no-repeat">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
      
      {/* Decorative blobs */}
      <div className="absolute left-1/4 top-1/4 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--primary))]/20 opacity-50 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 size-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-[hsl(var(--secondary))]/20 opacity-50 blur-[100px]" />
      
      <div className="relative z-10 w-full max-w-[400px] px-4">
        <div className="mb-8 flex flex-col items-center justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))] shadow-lg">
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Sentient Engine</h1>
        </div>
        
        {children}
      </div>
    </div>
  )
}
