export function SiteFooter() {
  return (
    <footer className="border-t border-outline-variant bg-surface-container-lowest">
      <div className="mx-auto flex max-w-container-max flex-col items-center gap-6 px-gutter py-10 sm:flex-row sm:justify-between">
        {/* Left — Brand + status */}
        <div className="flex items-center gap-4">
          <span className="text-base font-bold text-foreground">
            Sentient AI
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-3 py-1">
            <span className="status-pulse inline-block size-2 rounded-full bg-forest-green text-forest-green" />
            <span className="font-mono text-mono-xs text-on-surface-variant">
              System Status: Operational
            </span>
          </span>
        </div>

        {/* Center — Links */}
        <nav className="flex flex-wrap items-center gap-5">
          {["Documentation", "API", "Privacy", "Terms"].map((label) => (
            <a
              key={label}
              href="#"
              className="text-sm text-on-surface-variant transition-colors hover:text-mist-teal"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right — Copyright */}
        <p className="text-xs text-on-surface-variant">
          © 2024 Sentient AI.
        </p>
      </div>
    </footer>
  )
}
