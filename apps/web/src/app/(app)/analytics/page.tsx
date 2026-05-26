"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts"
import { MOCK_VELOCITY_DATA, MOCK_AGENT_BREAKDOWN, MOCK_HEATMAP_DATA } from "@/mocks/fixtures/analytics.fixture"
import { PageTransition } from "@/components/shared/PageTransition"
import { BarChart3, Download, ArrowUpRight, ShieldAlert, CheckCircle2, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AnalyticsPage() {
  const { theme } = useTheme()
  const isDark = theme !== "light"

  const [activeRange, setActiveRange] = React.useState("30d")

  // Color Constants (Semantic)
  const tealColor = "#74959B"
  const greenColor = "#49776B"
  const amberColor = "#D4874A"
  const redColor = "#C0504A"
  const grayColor = "#5C6B5F"

  // Pie chart data mapping
  const pieData = [
    { name: "Active/Healthy", value: 40, color: greenColor },
    { name: "In Progress", value: 30, color: tealColor },
    { name: "Blocked", value: 15, color: redColor },
    { name: "Completed", value: 15, color: grayColor }
  ]

  // Recharts theme borders/lines
  const gridStroke = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"

  return (
    <PageTransition className="flex flex-col gap-6 pb-12">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Analytics
          </h1>
          <p className="text-[13px] text-[var(--foreground-2)]">
            Business intelligence — powered by your reality engine
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 bg-[var(--surface-2)] p-1 rounded-lg border border-[var(--glass-border)]">
          {["7d", "30d", "90d", "Custom"].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setActiveRange(range)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all font-mono",
                activeRange === range 
                  ? "bg-primary text-white" 
                  : "text-[var(--foreground-2)] hover:text-foreground"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* ── Top Stats Row (3 cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Agent Actions */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <span className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider">
              Total Agent Actions
            </span>
            <span className="text-xs font-semibold text-forest-green font-mono bg-forest-green/10 px-1.5 py-0.5 rounded">
              +18%
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-foreground font-mono">
              3,847
            </span>
            {/* Sparkline trend upward */}
            <svg className="w-20 h-8 text-forest-green shrink-0" viewBox="0 0 100 30" fill="none">
              <path d="M0,25 Q15,20 30,22 T60,10 T90,5 L100,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Tasks Completed */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <span className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider">
              Tasks Completed
            </span>
            <span className="text-xs font-semibold text-forest-green font-mono bg-forest-green/10 px-1.5 py-0.5 rounded">
              ↑ 24
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-foreground font-mono">
              142
            </span>
            {/* Sparkline trend upward */}
            <svg className="w-20 h-8 text-forest-green shrink-0" viewBox="0 0 100 30" fill="none">
              <path d="M0,28 Q15,25 35,27 T65,15 T95,8 L100,4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: System Uptime */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <span className="font-mono text-label-caps uppercase text-[var(--foreground-3)] tracking-wider">
              System Uptime
            </span>
            <span className="text-xs font-semibold text-[var(--foreground-3)] font-mono bg-[var(--surface-3)] px-1.5 py-0.5 rounded">
              99.8%
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-foreground font-mono">
              99.8%
            </span>
            {/* Sparkline flat */}
            <svg className="w-20 h-8 text-[var(--foreground-3)] shrink-0" viewBox="0 0 100 30" fill="none">
              <path d="M0,15 L20,15 L40,16 L60,15 L80,15 L100,15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

      </div>

      {/* ── Main Charts Grid Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Task Completion Velocity (60% width equivalent) */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 flex flex-col justify-between h-[350px]">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Task Velocity</h3>
              <p className="text-[11px] text-[var(--foreground-3)] font-mono">Daily volume output</p>
            </div>
            <div className="flex gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-[10px] font-mono text-[var(--foreground-3)] uppercase">Completed tasks</span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_VELOCITY_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={tealColor} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={tealColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => d.substring(8, 10)} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "var(--foreground-3)" }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "var(--foreground-3)" }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(37,40,39,0.9)", 
                    borderColor: "var(--glass-border)", 
                    borderRadius: "10px" 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="completedTasks" 
                  stroke={tealColor} 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorTeal)" 
                  dot={{ r: 3, fill: tealColor }} 
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Custom Anomaly Marker Tooltip overlay absolute placed at day 14 */}
            <div className="absolute top-[35%] left-[45%] flex flex-col items-center">
              <div className="size-2.5 rounded-full bg-red border-2 border-background animate-ping absolute" />
              <div className="size-2.5 rounded-full bg-red border-2 border-background cursor-pointer" title="Nova flagged slowdown" />
            </div>
          </div>
        </div>

        {/* Chart 2: Agent Action Breakdown (40% width equivalent) */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col justify-between h-[350px]">
          <div>
            <h3 className="text-sm font-bold text-foreground">Agent Activity</h3>
            <p className="text-[11px] text-[var(--foreground-3)] font-mono">Breakdown of operational requests</p>
          </div>

          <div className="flex-1 w-full min-h-0 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_AGENT_BREAKDOWN} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="agent" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--foreground-3)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--foreground-3)" }} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(37,40,39,0.9)", borderColor: "var(--glass-border)", borderRadius: "10px" }} />
                <Bar dataKey="operations" stackId="a" fill={tealColor} />
                <Bar dataKey="finance" stackId="a" fill={amberColor} />
                <Bar dataKey="dev" stackId="a" fill={greenColor} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono text-[var(--foreground-3)] uppercase pt-3 border-t border-[var(--glass-border)]">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span>Aria</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber" />
              <span>Nova</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-green" />
              <span>Echo</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Main Charts Grid Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 3: Productivity Heatmap (60% width equivalent) */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 space-y-4 h-[330px]">
          <div>
            <h3 className="text-sm font-bold text-foreground">Team Productivity</h3>
            <p className="text-[11px] text-[var(--foreground-3)] font-mono">Activity levels over the last 90 days</p>
          </div>

          {/* Grid Layout representing contributions calendar */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto justify-start max-w-full">
              {MOCK_HEATMAP_DATA.map((day, idx) => {
                let color = "bg-[#1E201F]" // Zero
                if (day.value > 75) color = "bg-[#74959B]" // Peak
                else if (day.value > 50) color = "bg-[#49776B]"
                else if (day.value > 20) color = "bg-[#2C3D33]"
                
                if (!isDark) {
                  color = "bg-[#EAEEF0]" // Zero light
                  if (day.value > 75) color = "bg-[#4D7A80]" // Peak light
                  else if (day.value > 50) color = "bg-[#3D6B5F]"
                  else if (day.value > 20) color = "bg-[#DDE6E0]"
                }

                return (
                  <div 
                    key={idx}
                    className={cn("size-3 rounded-[2px] transition-all hover:scale-110", color)}
                    title={`${day.date}: ${day.value} events`}
                  />
                )
              })}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono text-[var(--foreground-3)] pt-2 uppercase">
              <span>Less</span>
              <div className="size-2.5 rounded-[1px] bg-[#1E201F] dark:bg-[#1E201F] light:bg-[#EAEEF0]" />
              <div className="size-2.5 rounded-[1px] bg-[#2C3D33] dark:bg-[#2C3D33] light:bg-[#DDE6E0]" />
              <div className="size-2.5 rounded-[1px] bg-[#49776B] dark:bg-[#49776B] light:bg-[#3D6B5F]" />
              <div className="size-2.5 rounded-[1px] bg-[#74959B] dark:bg-[#74959B] light:bg-[#4D7A80]" />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Chart 4: Project Health (Donut 40% width equivalent) */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col justify-between h-[330px]">
          <div>
            <h3 className="text-sm font-bold text-foreground">Project Status</h3>
            <p className="text-[11px] text-[var(--foreground-3)] font-mono">Workspace performance distribution</p>
          </div>

          <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Total count center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-foreground">4</span>
              <span className="text-[9px] font-mono uppercase text-[var(--foreground-3)]">Projects</span>
            </div>
          </div>

          {/* Legend list right */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[var(--foreground-3)] pt-3 border-t border-[var(--glass-border)] uppercase">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Row 3: Anomaly Alerts Panel ── */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">AI-Detected Anomalies</h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber font-mono bg-amber/10 border border-amber/20 rounded px-1.5 py-0.5">
              <span>🤖 Nova</span>
            </div>
          </div>
          <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 font-mono">
            Audit Ledger <ChevronRight className="size-3" />
          </button>
        </div>

        {/* Alerts logs */}
        <div className="space-y-3.5">
          {/* Alert 1 */}
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3 text-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-amber mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground">
                  Stripe payment processing slowdown — batch #842, 3 transactions flagged
                </h4>
                <p className="text-xs text-[var(--foreground-3)] font-mono mt-1">
                  Detected 2h ago &middot; Nova &middot; Finance
                </p>
              </div>
            </div>
            <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 font-mono shrink-0">
              View <ArrowUpRight className="size-3.5" />
            </button>
          </div>

          {/* Alert 2 */}
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3 text-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-amber mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground">
                  Task completion rate dropped 34% in Engineering workspace — possible bottleneck
                </h4>
                <p className="text-xs text-[var(--foreground-3)] font-mono mt-1">
                  Detected 6h ago &middot; Aria &middot; Operations
                </p>
              </div>
            </div>
            <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 font-mono shrink-0">
              View <ArrowUpRight className="size-3.5" />
            </button>
          </div>

          {/* Alert 3 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-forest-green mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-[var(--foreground-2)]">
                  API latency spike resolved — P99 back to normal (84ms)
                </h4>
                <p className="text-xs text-[var(--foreground-3)] font-mono mt-1">
                  Resolved 1h ago &middot; System
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-forest-green bg-forest-green/10 border border-forest-green/20 rounded px-2 py-0.5">
              Resolved
            </span>
          </div>
        </div>

      </div>

    </PageTransition>
  )
}
