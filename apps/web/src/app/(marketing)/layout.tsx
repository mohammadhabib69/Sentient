import * as React from "react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const NAV_LINKS: readonly { label: string; href: string; active?: boolean }[] = [
  { label: "Intelligence", href: "#", active: true },
  { label: "Agents", href: "#agents" },
  { label: "Reality Stream", href: "#stream" },
  { label: "Pricing", href: "#pricing" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* ── Sticky navbar ── */}
      <header className="fixed top-0 z-50 w-full border-b border-glass-border bg-background/75 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-container-max items-center justify-between px-gutter">
          {/* Left — Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-mist-teal">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Sentient</span>
          </div>

          {/* Center — Nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  link.active
                    ? "text-foreground underline underline-offset-4 decoration-mist-teal"
                    : "text-on-surface-variant hover:text-foreground"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right — Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            <a
              href="/login"
              className="hidden text-sm font-medium text-on-surface-variant transition-colors hover:text-foreground sm:inline-block"
            >
              Login
            </a>

            <a
              href="#deploy"
              className="inline-flex h-9 items-center rounded-full bg-forest-green px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Deploy Agent
            </a>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main>{children}</main>
    </div>
  );
}
