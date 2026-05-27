"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Blocks, Code, MessageSquare, Database, Mail } from "lucide-react";

export default function IntegrationsSettingsPage() {
  const integrations = [
    {
      name: "GitHub",
      description: "Connect repositories for code analysis.",
      icon: Code,
      connected: true,
    },
    {
      name: "Slack",
      description: "Receive agent alerts and notifications.",
      icon: MessageSquare,
      connected: false,
    },
    {
      name: "PostgreSQL",
      description: "Allow agents to read database schema.",
      icon: Database,
      connected: true,
    },
    {
      name: "Google Workspace",
      description: "Connect Docs, Sheets, and Drive.",
      icon: Mail,
      connected: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
        <p className="text-sm text-[var(--foreground-3)]">
          Connect Sentient to your external tools and services.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration, i) => {
          const Icon = integration.icon;
          return (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5 shadow-sm transition-all hover:bg-[var(--surface-2)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--surface-3)] text-[var(--foreground-2)]">
                  <Icon className="size-5" />
                </div>
                {integration.connected ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-[var(--green)]/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--green)]">
                    Connected
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-foreground">{integration.name}</h4>
                <p className="mt-1 text-sm text-[var(--foreground-3)] line-clamp-2">
                  {integration.description}
                </p>
              </div>

              <div className="mt-6">
                {integration.connected ? (
                  <Button
                    variant="outline"
                    className="w-full border-[var(--glass-border)] hover:bg-[var(--red)]/10 hover:text-[var(--red)] hover:border-[var(--red)]/20"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full">
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
