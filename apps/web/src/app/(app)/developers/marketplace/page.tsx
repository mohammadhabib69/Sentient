"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface Plugin {
  name: string
  author: string
  desc: string
  price: string
  installs: string
  rating: number
  category: string
  icon: string
  gradient: string
}

const PLUGINS: Plugin[] = [
  {
    name: "GitHub Advanced",
    author: "Sentient Labs",
    desc: "Deep GitHub integration with PR analysis",
    price: "Free",
    installs: "1.2k installs",
    rating: 4.8,
    category: "Integrations",
    icon: "🐙",
    gradient: "from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30",
  },
  {
    name: "Datadog Monitor",
    author: "MonitorCo",
    desc: "Connect Datadog metrics to agent context",
    price: "$9/mo",
    installs: "340 installs",
    rating: 4.4,
    category: "Analytics",
    icon: "📊",
    gradient: "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
  },
  {
    name: "Slack Connect",
    author: "Sentient Labs",
    desc: "Rich Slack notifications with agent actions",
    price: "Free",
    installs: "2.1k installs",
    rating: 4.9,
    category: "Integrations",
    icon: "💬",
    gradient: "from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30",
  },
  {
    name: "Shopify Sync",
    author: "CommercePlug",
    desc: "E-commerce data in your reality stream",
    price: "$19/mo",
    installs: "89 installs",
    rating: 4.0,
    category: "Agents",
    icon: "🛍️",
    gradient: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    name: "Email Campaign",
    author: "MailBridge",
    desc: "Connect email analytics to Nova agent",
    price: "$12/mo",
    installs: "156 installs",
    rating: 4.2,
    category: "Automation",
    icon: "✉️",
    gradient: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    name: "Calendar Sync",
    author: "Sentient Labs",
    desc: "Sync deadlines with Google/Outlook",
    price: "Free",
    installs: "890 installs",
    rating: 4.6,
    category: "Automation",
    icon: "📅",
    gradient: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
  },
]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState("All")
  const [installedPlugins, setInstalledPlugins] = React.useState<Record<string, boolean>>({
    "Slack Connect": true, // Slack Connect starts as installed
  })

  const toggleInstall = (pluginName: string) => {
    const isCurrentlyInstalled = !!installedPlugins[pluginName]
    setInstalledPlugins((prev) => ({
      ...prev,
      [pluginName]: !isCurrentlyInstalled,
    }))
    
    if (isCurrentlyInstalled) {
      toast.success(`${pluginName} has been uninstalled.`)
    } else {
      toast.success(`${pluginName} installed successfully!`)
    }
  }

  const filteredPlugins = PLUGINS.filter((plugin) => {
    const matchesCategory = activeFilter === "All" || plugin.category === activeFilter
    const matchesSearch =
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = ["All", "Agents", "Integrations", "Analytics", "Automation"]

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Plugin Marketplace</h2>
          <p className="text-xs text-[var(--foreground-3)] mt-0.5">
            Discover and manage plugins to extend the capabilities of your Sentient agents.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--foreground-3)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins..."
            className="w-full rounded-lg border border-[var(--glass-border)] bg-[var(--surface-1)] py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[hsl(var(--primary))] transition-all placeholder:text-[var(--foreground-3)]/60"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--glass-border)] pb-4">
        {categories.map((category) => {
          const isActive = activeFilter === category
          return (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150",
                isActive
                  ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                  : "bg-[var(--surface-1)] border-[var(--glass-border)] text-[var(--foreground-2)] hover:text-foreground hover:bg-[var(--surface-2)]"
              )}
            >
              {category}
            </button>
          )
        })}
      </div>

      {/* Plugin Grid */}
      {filteredPlugins.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 border border-dashed border-[var(--glass-border)] rounded-2xl bg-[var(--surface-1)]/50"
        >
          <span className="text-4xl mb-3">🔍</span>
          <h3 className="text-sm font-semibold text-foreground">No plugins found</h3>
          <p className="text-xs text-[var(--foreground-3)] mt-1">
            Try adjusting your search query or choosing another category.
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredPlugins.map((plugin) => {
              const isInstalled = !!installedPlugins[plugin.name]
              return (
                <motion.div
                  layout
                  key={plugin.name}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="glass-panel flex flex-col justify-between p-5 rounded-xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md border border-[var(--glass-border)]"
                >
                  <div>
                    {/* Top Row: Icon & Status badge */}
                    <div className="flex items-start justify-between gap-4">
                      <div className={cn(
                        "flex size-12 items-center justify-center rounded-xl border bg-gradient-to-br text-2xl shadow-inner shrink-0",
                        plugin.gradient
                      )}>
                        {plugin.icon}
                      </div>

                      {isInstalled && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 border border-emerald-500/20">
                          Installed
                        </span>
                      )}
                    </div>

                    {/* Plugin Info */}
                    <div className="mt-4">
                      <h4 className="font-bold text-[15px] text-foreground leading-tight">
                        {plugin.name}
                      </h4>
                      <p className="text-xs text-[var(--foreground-3)] mt-0.5">
                        by {plugin.author}
                      </p>
                      <p className="mt-2 text-[13px] text-[var(--foreground-2)] line-clamp-2 min-h-[38px] leading-relaxed">
                        {plugin.desc}
                      </p>
                    </div>

                    {/* Rating & Installs */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={cn(
                                "text-sm select-none leading-none",
                                star <= Math.round(plugin.rating)
                                  ? "text-amber-500"
                                  : "text-[var(--foreground-3)] opacity-35"
                              )}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-[12px] font-semibold text-[var(--foreground-2)] ml-1">
                          {plugin.rating}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--foreground-3)] font-medium">
                        {plugin.installs}
                      </span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-5 pt-4 border-t border-[var(--glass-border)] flex items-center justify-between">
                    <div>
                      <span className={cn(
                        "text-sm font-semibold",
                        plugin.price === "Free" ? "text-emerald-500 dark:text-emerald-400" : "text-foreground"
                      )}>
                        {plugin.price}
                      </span>
                    </div>

                    {isInstalled ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => toggleInstall(plugin.name)}
                        className="h-8 text-xs font-semibold px-3.5"
                      >
                        Uninstall
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleInstall(plugin.name)}
                        className="h-8 text-xs font-semibold px-3.5"
                      >
                        Install
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
