"use client";

import { AgentBuilderCanvas } from "@/components/agents/AgentBuilderCanvas";

export default function Page() {
  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-3.5rem)] overflow-hidden bg-[var(--surface-1)]">
      <AgentBuilderCanvas />
    </div>
  );
}
