"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const STEPS = [
  { path: "/onboarding/org", label: "Organization" },
  { path: "/onboarding/team", label: "Team" },
  { path: "/onboarding/workspace", label: "Workspace" },
  { path: "/onboarding/agents", label: "Agents" },
  { path: "/onboarding/done", label: "Ready" },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((step) => step.path === pathname);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  // Progress is calculated out of 100% (20%, 40%, 60%, 80%, 100%)
  const progress = ((activeIndex + 1) / STEPS.length) * 100;

  // For step 4 (Agents), the card should be slightly wider (720px)
  const isAgentsStep = pathname === "/onboarding/agents";
  const maxW = isAgentsStep ? "max-w-[720px]" : "max-w-[640px]";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Subtle radial gradient center glow in primary color at 5% opacity */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(116,149,155,0.08)_0%,transparent_70%)]" />

      {/* Top Progress Bar Track */}
      <div className="h-[4px] w-full bg-[#374039] dark:bg-[#374039] light:bg-[#DDE6E0] relative z-20">
        <motion.div
          className={cn(
            "h-full transition-colors duration-300",
            pathname === "/onboarding/done" ? "bg-forest-green" : "bg-primary",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
        />
      </div>

      {/* Step Indicator Header */}
      <div className="mx-auto mt-8 w-full max-w-xl px-6">
        <div className="flex justify-between items-center relative">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isFuture = idx > activeIndex;

            return (
              <div key={step.path} className="flex flex-col items-center flex-1 relative z-10">
                {/* Dot indicator */}
                <div className="mb-2 flex items-center justify-center size-5">
                  {isCompleted ? (
                    <div className="size-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                  ) : isCurrent ? (
                    <div className="size-2.5 rounded-full border-2 border-primary bg-background" />
                  ) : (
                    <div className="size-2 rounded-full border border-muted-foreground/30 bg-transparent" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-wider uppercase transition-colors duration-200",
                    isCurrent ? "text-primary" : "text-[var(--foreground-3)]",
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Children content area */}
      <div className="flex flex-1 items-center justify-center p-6 relative z-10">
        <div className={cn("relative w-full transition-all duration-300", maxW)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
