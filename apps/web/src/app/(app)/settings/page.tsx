"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default function OrganizationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Organization Settings</h2>
        <p className="text-sm text-[var(--foreground-3)]">
          Manage your company details and global preferences.
        </p>
      </div>

      <div className="space-y-8 rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-6 shadow-sm">
        {/* Profile Picture */}
        <div className="flex items-center gap-6">
          <div className="flex size-20 items-center justify-center rounded-xl bg-[var(--surface-3)] text-[var(--foreground-3)]">
            <Building2 className="size-8" />
          </div>
          <div>
            <Button variant="outline" size="sm">
              Upload Logo
            </Button>
            <p className="mt-2 text-xs text-[var(--foreground-3)]">Recommended size: 256x256px</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--foreground-2)]">
              Organization Name
            </label>
            <input
              type="text"
              defaultValue="Acme Corp"
              className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none focus:border-[hsl(var(--primary))]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--foreground-2)]">Industry</label>
            <select className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-foreground outline-none focus:border-[hsl(var(--primary))]">
              <option>Technology</option>
              <option>Finance</option>
              <option>Healthcare</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-[var(--foreground-2)]">
              Organization Domain
            </label>
            <div className="flex rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] overflow-hidden focus-within:border-[hsl(var(--primary))]">
              <span className="flex items-center bg-[var(--surface-3)] px-3 text-sm text-[var(--foreground-3)]">
                https://
              </span>
              <input
                type="text"
                defaultValue="acme"
                className="w-full bg-transparent px-3 py-2 text-sm text-foreground outline-none"
              />
              <span className="flex items-center bg-[var(--surface-3)] px-3 text-sm text-[var(--foreground-3)]">
                .sentient.app
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[var(--glass-border)]">
          <Button className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
