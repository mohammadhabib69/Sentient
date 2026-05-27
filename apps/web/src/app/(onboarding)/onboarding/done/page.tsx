"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import confetti from "canvas-confetti";

export default function DoneSetupPage() {
  const router = useRouter();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    // Standard side burst confetti
    const end = Date.now() + 2 * 1000;
    const colors = ["#74959B", "#49776B", "#D4874A"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="glass-panel rounded-[20px] p-8 shadow-[var(--shadow-card)] text-center space-y-6 relative overflow-hidden">
      {/* Radiating Sparkles Backing Animation */}
      <div className="absolute inset-x-0 top-0 h-40 flex items-center justify-center pointer-events-none">
        <div className="absolute size-32 rounded-full bg-forest-green/10 blur-xl animate-pulse-slow" />
        {/* Radiating small particle elements via absolute positions */}
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute size-1.5 rounded-full bg-forest-green/60"
            style={{
              transform: `rotate(${i * 45}deg) translateY(-50px)`,
              animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) infinite`,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>

      {/* Large Checkmark Icon */}
      <div className="relative mx-auto mt-6 flex size-16 items-center justify-center rounded-full border border-forest-green/20 bg-forest-green/15 text-forest-green shadow-[0_0_24px_rgba(73,119,107,0.25)]">
        <Check className="size-8 stroke-[3]" />
      </div>

      <div className="space-y-2">
        <h2 className="text-[28px] font-bold tracking-tight text-foreground">
          Your reality engine is ready
        </h2>
        <p className="text-sm text-[var(--foreground-2)] max-w-md mx-auto">
          Aria and Flux are now monitoring your organization
        </p>
      </div>

      {/* Feature Pills Row */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        {["✓ 2 Agents Active", "✓ 1 Workspace Created", "✓ Team Notified"].map((pill, i) => (
          <div
            key={i}
            className="glass-panel px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-forest-green bg-forest-green/10 border-forest-green/10"
          >
            {pill}
          </div>
        ))}
      </div>

      <div className="pt-4 space-y-4">
        <Button
          onClick={() => router.push("/dashboard")}
          className="w-full h-11 bg-primary hover:brightness-110 text-white font-semibold rounded-lg flex items-center justify-center transition-all"
        >
          Go to Dashboard &rarr;
        </Button>

        <div>
          <button
            onClick={() => router.push("/developers")}
            className="text-xs font-medium text-[var(--foreground-3)] hover:text-foreground hover:underline transition-colors font-mono"
          >
            or explore the documentation first &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
