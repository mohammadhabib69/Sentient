"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentConfig {
  id: string;
  name: string;
  initials: string;
  role: string;
  description: string;
  color: string; // theme token color name or hex
  bgOpacity: string;
  borderClass: string;
  textClass: string;
}

const AGENTS: AgentConfig[] = [
  {
    id: "ops",
    name: "Aria",
    initials: "AR",
    role: "Operations Agent",
    description: "Manages tasks, deadlines, and team assignments",
    color: "hsl(var(--primary))",
    bgOpacity: "bg-primary/20",
    borderClass: "border-primary",
    textClass: "text-primary",
  },
  {
    id: "dev",
    name: "Flux",
    initials: "FL",
    role: "Dev Agent",
    description: "GitHub integration, bug tracking, deployments",
    color: "#aaccd3",
    bgOpacity: "bg-[#aaccd3]/20",
    borderClass: "border-[#aaccd3]",
    textClass: "text-[#aaccd3]",
  },
  {
    id: "fin",
    name: "Nova",
    initials: "NV",
    role: "Finance Agent",
    description: "Tracks invoices, anomalies, and cash flow",
    color: "hsl(var(--amber))",
    bgOpacity: "bg-amber/20",
    borderClass: "border-amber",
    textClass: "text-amber",
  },
  {
    id: "cust",
    name: "Echo",
    initials: "EC",
    role: "Customer Agent",
    description: "Monitors sentiment and client communication",
    color: "hsl(var(--green))",
    bgOpacity: "bg-green/20",
    borderClass: "border-green",
    textClass: "text-green",
  },
];

export default function AgentsSetupPage() {
  const router = useRouter();
  const [activeAgents, setActiveAgents] = React.useState<string[]>(["ops", "dev"]);

  const toggleAgent = (id: string) => {
    setActiveAgents((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    router.push("/onboarding/done");
  };

  return (
    <div className="glass-panel rounded-[20px] p-8 shadow-[var(--shadow-card)] space-y-6">
      <div className="space-y-1">
        <span className="text-[11px] font-bold tracking-widest uppercase text-primary">
          STEP 4 OF 5
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Activate your AI workforce
        </h2>
        <p className="text-sm text-[var(--foreground-2)]">
          Select which agents to deploy. You can change this anytime.
        </p>
      </div>

      {/* Grid of Agent Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENTS.map((agent) => {
          const isON = activeAgents.includes(agent.id);
          return (
            <div
              key={agent.id}
              onClick={() => toggleAgent(agent.id)}
              className={cn(
                "group cursor-pointer rounded-xl border p-4 flex items-center justify-between transition-all duration-200 select-none",
                isON
                  ? "bg-primary/5 border-primary shadow-sm"
                  : "bg-[var(--surface-1)] border-[var(--glass-border)] hover:bg-[var(--surface-2)]",
              )}
            >
              <div className="flex items-center gap-3">
                {/* Colored Avatar */}
                <div className="relative">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                      agent.bgOpacity,
                      agent.textClass,
                    )}
                  >
                    {agent.initials}
                  </div>
                  {/* Status dot */}
                  {isON && (
                    <span className="status-pulse absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface-container bg-forest-green" />
                  )}
                </div>

                {/* Info */}
                <div className="space-y-0.5 max-w-[180px] md:max-w-[160px]">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    {agent.name}
                  </h4>
                  <p className="text-[11px] text-[var(--foreground-2)] leading-tight">
                    {agent.role}
                  </p>
                  <p className="text-[10px] text-[var(--foreground-3)] leading-tight truncate">
                    {agent.description}
                  </p>
                </div>
              </div>

              {/* Custom Switch Toggle */}
              <div
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                  isON ? "bg-primary" : "bg-[var(--surface-3)]",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    isON ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 space-y-4">
        <Button
          onClick={handleContinue}
          disabled={activeAgents.length === 0}
          className="w-full h-11 bg-primary hover:brightness-110 text-white font-semibold rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Activate Selected Agents &rarr;
        </Button>

        <div className="text-center text-xs text-[var(--foreground-3)] font-mono">4 of 5</div>
      </div>
    </div>
  );
}
