"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

const STEPS = [
  '/onboarding/org',
  '/onboarding/team',
  '/onboarding/workspace',
  '/onboarding/agents',
  '/onboarding/done'
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentIndex = STEPS.indexOf(pathname)
  const progress = currentIndex === -1 ? 0 : ((currentIndex + 1) / STEPS.length) * 100

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--surface-1)]">
      
      {/* Top Progress Bar */}
      <div className="h-1.5 w-full bg-[var(--surface-2)]">
        <motion.div 
          className="h-full bg-[hsl(var(--primary))]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="relative w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
