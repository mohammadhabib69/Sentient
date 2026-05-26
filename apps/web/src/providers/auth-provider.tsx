"use client"

import * as React from "react"
// import { useAuthStore } from "@/store/auth.store"
// import { useRouter, usePathname } from "next/navigation"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // TODO: Implement actual Zustand auth check and redirects based on pathname
  return <>{children}</>
}
