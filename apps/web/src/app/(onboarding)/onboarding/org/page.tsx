"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function OrgSetupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Go to step 2
    router.push("/onboarding/team");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-[20px] p-8 shadow-[var(--shadow-card)] space-y-6"
    >
      <div className="space-y-1">
        <span className="text-[11px] font-bold tracking-widest uppercase text-primary">
          STEP 1 OF 5
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Set up your organization
        </h2>
        <p className="text-sm text-[var(--foreground-2)]">
          This is your company's home on Sentient
        </p>
      </div>

      <div className="space-y-4">
        {/* Org Name */}
        <div className="space-y-1.5">
          <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
            Organization name
          </label>
          <input
            type="text"
            required
            placeholder="Acme Corp"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>

        {/* Grid for Industry & Team Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Industry */}
          <div className="space-y-1.5">
            <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
              Industry
            </label>
            <select className="w-full h-11 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary">
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="ecommerce">E-commerce</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Team Size */}
          <div className="space-y-1.5">
            <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
              Team size
            </label>
            <select className="w-full h-11 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary">
              <option value="just_me">Just me</option>
              <option value="2-10">2-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="200+">200+</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <Button
          type="submit"
          className="w-full h-11 bg-primary hover:brightness-110 text-white font-semibold rounded-lg flex items-center justify-center transition-all"
        >
          Continue &rarr;
        </Button>

        <div className="text-center text-xs text-[var(--foreground-3)] font-mono">1 of 5</div>
      </div>
    </form>
  );
}
