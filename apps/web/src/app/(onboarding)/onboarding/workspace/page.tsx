"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Go to step 4
    router.push("/onboarding/agents");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-[20px] p-8 shadow-[var(--shadow-card)] space-y-6"
    >
      <div className="space-y-1">
        <span className="text-[11px] font-bold tracking-widest uppercase text-primary">
          STEP 3 OF 5
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create your first workspace
        </h2>
        <p className="text-sm text-[var(--foreground-2)]">
          Workspaces organize your projects and agents
        </p>
      </div>

      <div className="space-y-4">
        {/* Workspace Name */}
        <div className="space-y-1.5">
          <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
            Workspace name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Engineering, Marketing, Operations"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>

        {/* Workspace Description */}
        <div className="space-y-1.5">
          <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
            Description{" "}
            <span className="text-[var(--foreground-3)] font-normal text-xs">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="What does this workspace focus on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-3 text-sm text-foreground outline-none transition-colors focus:border-primary resize-none"
          />
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <Button
          type="submit"
          className="w-full h-11 bg-primary hover:brightness-110 text-white font-semibold rounded-lg flex items-center justify-center transition-all"
        >
          Continue &rarr;
        </Button>

        <div className="text-center text-xs text-[var(--foreground-3)] font-mono">3 of 5</div>
      </div>
    </form>
  );
}
