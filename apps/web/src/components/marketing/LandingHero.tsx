"use client"

import dynamic from "next/dynamic"

const ParticleCanvas = dynamic(
  () => import("./ParticleField").then((mod) => mod.ParticleCanvas),
  { ssr: false }
)

export function LandingHero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* ── Particle background ── */}
      <div className="absolute inset-0 -z-10 opacity-60">
        <ParticleCanvas />
        {/* Vignette fade */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_80%)]" />
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto w-full max-w-container-max px-gutter py-24 lg:py-0">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT — Copy */}
          <div className="flex flex-col gap-8">
            <h1 className="text-hero-900 text-foreground">
              Your Business,
              <br />
              Running on{" "}
              <span className="shimmer-text text-mist-teal">Intelligence</span>
            </h1>

            <p className="max-w-lg text-body-lg text-on-surface-variant">
              Deploy autonomous agents that analyze, act, and adapt in
              real-time. High-tech mission control for the AI-native enterprise.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="inline-flex h-12 items-center gap-2 rounded-full bg-forest-green px-8 text-base font-semibold text-white shadow-[0_0_24px_rgba(73,119,107,0.45)] transition hover:brightness-110">
                Initialize Core
              </button>
              <button className="glass-panel inline-flex h-12 items-center gap-2 rounded-full px-8 text-base font-medium text-foreground transition hover:brightness-110">
                View Documentation
              </button>
            </div>
          </div>

          {/* RIGHT — Dashboard card */}
          <div className="hidden lg:block">
            <div className="perspective-container">
              <div className="dashboard-tilt glass-panel rounded-xl p-5 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.55)]"
                   style={{ transformStyle: "preserve-3d" }}>
                {/* Title bar */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full bg-error-red" />
                    <span className="inline-block size-2.5 rounded-full bg-amber-alert" />
                    <span className="inline-block size-2.5 rounded-full bg-forest-green" />
                  </div>
                  <span className="font-mono text-mono-xs uppercase tracking-widest text-mist-teal">
                    SYS_STAT: OPTIMAL
                  </span>
                </div>

                {/* Metric row */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  {/* Active Agents */}
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                    <p className="text-label-caps uppercase tracking-widest text-on-surface-variant">
                      Active Agents
                    </p>
                    <p className="mt-2 font-mono text-metric-lg text-on-surface">
                      12 / 12
                    </p>
                  </div>
                  {/* Throughput */}
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                    <p className="text-label-caps uppercase tracking-widest text-on-surface-variant">
                      Throughput
                    </p>
                    <p className="mt-2 font-mono text-metric-lg text-on-surface">
                      8.4k req/s
                    </p>
                  </div>
                </div>

                {/* Neural Activity */}
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <p className="text-label-caps uppercase tracking-widest text-on-surface-variant">
                    Neural Activity
                  </p>
                  {/* Fake bar graph */}
                  <div className="mt-3 flex items-end gap-1">
                    {[40, 65, 35, 80, 55, 70, 90, 45, 75, 60, 85, 50, 95, 38, 72, 58, 88, 42, 68, 78].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-mist-teal/30"
                          style={{ height: `${h}px` }}
                        />
                      )
                    )}
                  </div>
                  {/* Gradient fade */}
                  <div className="mt-[-32px] h-8 bg-gradient-to-t from-surface-container-low to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
