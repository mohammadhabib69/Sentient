"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { useUIStore } from "@/store/ui.store";
import { GlassSidebar } from "./GlassSidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "@/components/shared/CommandPalette";

interface AppShellProps {
  children: React.ReactNode;
}

// Same spring config used in GlassSidebar for perfect sync
const SPRING = { damping: 30, stiffness: 300, type: "spring" as const };

// left: 16px + width: 240px + gap: 16px = 272px
const PADDING_EXPANDED = 272;
// left: 16px + width: 72px + gap: 16px = 104px
const PADDING_COLLAPSED = 104;

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed } = useUIStore();

  // To avoid hydration mismatch on first render since default sidebar state might differ
  // from localStorage, we render the layout without strict initial motion styles,
  // letting it snap/animate into place once hydrated.
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full bg-background">
      {/* ── Fixed Sidebar ── */}
      <GlassSidebar />

      {/* ── Main Content Area ── */}
      <motion.div
        className="flex min-h-screen flex-1 flex-col transition-[padding] duration-150"
        animate={{
          paddingLeft: !mounted
            ? PADDING_COLLAPSED // Default server render assumption
            : sidebarCollapsed
              ? PADDING_COLLAPSED
              : PADDING_EXPANDED,
        }}
        transition={SPRING}
      >
        {/* Topbar is sticky inside the main content area */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 px-6 pb-6 pt-6">{children}</main>
      </motion.div>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
