"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/ui.store";
import { Search, Monitor, User, Settings, FolderKanban, Activity, Blocks } from "lucide-react";
import { useTheme } from "next-themes";

export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { searchOpen, setSearchOpen } = useUIStore();

  // Toggle the menu when ⌘K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [searchOpen, setSearchOpen]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      setSearchOpen(false);
      command();
    },
    [setSearchOpen],
  );

  return (
    <AnimatePresence>
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Palette Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-50 w-full max-w-[600px] overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] shadow-2xl backdrop-blur-xl"
          >
            <Command
              className="flex h-full max-h-[400px] w-full flex-col bg-transparent"
              label="Global Command Menu"
              shouldFilter={true}
            >
              <div className="flex items-center border-b border-[var(--glass-border)] px-4">
                <Search className="mr-3 size-5 text-[var(--foreground-3)]" />
                <Command.Input
                  autoFocus
                  placeholder="Search operations, agents, logs..."
                  className="flex h-14 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-[var(--foreground-3)]"
                />
                <div className="hidden rounded bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--foreground-3)] sm:block">
                  ESC
                </div>
              </div>

              <Command.List className="overflow-y-auto overflow-x-hidden p-2 scrollbar-hide">
                <Command.Empty className="py-6 text-center text-sm text-[var(--foreground-3)]">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="text-xs text-[var(--foreground-3)]">
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/dashboard"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-2)] aria-selected:bg-[var(--surface-2)]"
                  >
                    <Monitor className="size-4" /> Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/agents"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-2)] aria-selected:bg-[var(--surface-2)]"
                  >
                    <Blocks className="size-4" /> Agent Fleet
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/stream"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-2)] aria-selected:bg-[var(--surface-2)]"
                  >
                    <Activity className="size-4" /> Reality Stream
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/projects/proj_1/board"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-2)] aria-selected:bg-[var(--surface-2)]"
                  >
                    <FolderKanban className="size-4" /> Q3 Project Board
                  </Command.Item>
                </Command.Group>

                <Command.Group
                  heading="Settings & Preferences"
                  className="mt-4 text-xs text-[var(--foreground-3)]"
                >
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/settings/profile"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-2)] aria-selected:bg-[var(--surface-2)]"
                  >
                    <User className="size-4" /> Profile Settings
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push("/settings"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-2)] aria-selected:bg-[var(--surface-2)]"
                  >
                    <Settings className="size-4" /> Organization Settings
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Theme" className="mt-4 text-xs text-[var(--foreground-3)]">
                  <Command.Item
                    onSelect={() => runCommand(() => setTheme("light"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-2)] aria-selected:bg-[var(--surface-2)]"
                  >
                    Switch to Light Theme
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => setTheme("dark"))}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-[var(--surface-2)] aria-selected:bg-[var(--surface-2)]"
                  >
                    Switch to Dark Theme
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
