"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Shield, Key, Smartphone, AlertTriangle } from "lucide-react";

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Security Settings</h2>
        <p className="text-sm text-[var(--foreground-3)]">
          Protect your workspace with advanced security controls.
        </p>
      </div>

      <div className="space-y-6">
        {/* 2FA */}
        <div className="flex flex-col gap-4 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
              <Smartphone className="size-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Two-Factor Authentication (2FA)</h4>
              <p className="text-sm text-[var(--foreground-3)] mt-1">
                Require an extra layer of security when logging in.
              </p>
            </div>
          </div>
          <Button variant="outline">Enable 2FA</Button>
        </div>

        {/* API Keys */}
        <div className="flex flex-col gap-4 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]/10 text-[hsl(var(--secondary))]">
              <Key className="size-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">API Access Keys</h4>
              <p className="text-sm text-[var(--foreground-3)] mt-1">
                Manage tokens for external programmatic access.
              </p>
            </div>
          </div>
          <Button variant="outline">Manage Keys</Button>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-[var(--red)]/20 bg-[var(--red)]/[0.02] p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--red)]/10 text-[var(--red)]">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--red)]">Danger Zone</h4>
              <p className="text-sm text-[var(--red)]/80 mt-1 mb-4">
                Permanently delete this organization and all associated data. This action cannot be
                undone.
              </p>
              <Button
                variant="outline"
                className="border-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)]/10"
              >
                Delete Organization
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
