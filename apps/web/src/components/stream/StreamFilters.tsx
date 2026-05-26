"use client"

import * as React from "react"
import { Search, Filter, Calendar } from "lucide-react"

export function StreamFilters() {
  return (
    <div className="flex h-full flex-col gap-6 rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)] p-5">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-foreground">Filters</h3>
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--foreground-3)]" />
          <input 
            type="text" 
            placeholder="Search events..." 
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[hsl(var(--primary))]"
          />
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--foreground-3)]">
            <Filter className="size-3.5" />
            Event Type
          </h4>
          <div className="space-y-2">
            {['All Events', 'Agent Actions', 'System Events', 'User Actions', 'Errors'].map((type, i) => (
              <label key={type} className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground-2)] hover:text-foreground">
                <input 
                  type="checkbox" 
                  defaultChecked={i === 0}
                  className="rounded border-[var(--glass-border)] bg-[var(--surface-3)] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]" 
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[var(--glass-border)] pt-4">
        <h4 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--foreground-3)]">
          <Calendar className="size-3.5" />
          Date Range
        </h4>
        <select className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-2 text-sm text-foreground outline-none">
          <option>Last 24 Hours</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Custom Range...</option>
        </select>
      </div>
    </div>
  )
}
