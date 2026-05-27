"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { User, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfileSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">My Profile</h2>
        <p className="text-sm text-[var(--foreground-3)]">
          Manage your personal information and preferences.
        </p>
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-6 shadow-sm">
        <h3 className="mb-6 font-semibold text-foreground">Personal Information</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--foreground-2)]">Full Name</label>
            <input
              type="text"
              defaultValue="Mohammad Habib"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none focus:border-[hsl(var(--primary))]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--foreground-2)]">Email Address</label>
            <input
              type="email"
              defaultValue="mohammad@acme.com"
              disabled
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-3)] px-3 py-2 text-sm text-[var(--foreground-3)] outline-none cursor-not-allowed"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button>Update Profile</Button>
        </div>
      </div>

      {/* Appearance / Theme */}
      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="font-semibold text-foreground">Appearance</h3>
          <p className="text-sm text-[var(--foreground-3)] mt-1">
            Select your preferred interface theme.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Light Mode Card */}
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "group relative flex flex-col items-start gap-4 rounded-xl border p-4 text-left transition-all",
              theme === "light"
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 ring-1 ring-[hsl(var(--primary))]"
                : "border-[var(--glass-border)] bg-[var(--surface-2)] hover:border-[var(--foreground-3)]",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Sun className="size-4" /> Light Mode
              </div>
              <div
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  theme === "light"
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                    : "border-[var(--glass-border)]",
                )}
              >
                {theme === "light" && <div className="size-1.5 rounded-full bg-white" />}
              </div>
            </div>

            {/* Minimal wireframe preview */}
            <div className="w-full overflow-hidden rounded-md border border-[#e5e5e5] bg-[#fafafa] p-2 shadow-sm">
              <div className="flex gap-2">
                <div className="w-1/4 space-y-1.5">
                  <div className="h-2 w-full rounded bg-[#e5e5e5]" />
                  <div className="h-2 w-full rounded bg-[#e5e5e5]" />
                  <div className="h-2 w-3/4 rounded bg-[#e5e5e5]" />
                </div>
                <div className="w-3/4 space-y-2">
                  <div className="h-10 w-full rounded bg-white border border-[#e5e5e5]" />
                  <div className="h-16 w-full rounded bg-white border border-[#e5e5e5]" />
                </div>
              </div>
            </div>
          </button>

          {/* Dark Mode Card */}
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "group relative flex flex-col items-start gap-4 rounded-xl border p-4 text-left transition-all",
              theme === "dark"
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 ring-1 ring-[hsl(var(--primary))]"
                : "border-[var(--glass-border)] bg-[var(--surface-2)] hover:border-[var(--foreground-3)]",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Moon className="size-4" /> Dark Mode
              </div>
              <div
                className={cn(
                  "size-4 rounded-full border flex items-center justify-center",
                  theme === "dark"
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                    : "border-[var(--glass-border)]",
                )}
              >
                {theme === "dark" && <div className="size-1.5 rounded-full bg-white" />}
              </div>
            </div>

            {/* Minimal wireframe preview */}
            <div className="w-full overflow-hidden rounded-md border border-[#27272a] bg-[#09090b] p-2 shadow-sm">
              <div className="flex gap-2">
                <div className="w-1/4 space-y-1.5">
                  <div className="h-2 w-full rounded bg-[#27272a]" />
                  <div className="h-2 w-full rounded bg-[#27272a]" />
                  <div className="h-2 w-3/4 rounded bg-[#27272a]" />
                </div>
                <div className="w-3/4 space-y-2">
                  <div className="h-10 w-full rounded bg-[#18181b] border border-[#27272a]" />
                  <div className="h-16 w-full rounded bg-[#18181b] border border-[#27272a]" />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
