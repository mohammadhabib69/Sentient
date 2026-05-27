"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Download } from "lucide-react"
import { PageTransition } from "@/components/shared/PageTransition"
import { GraphToolbar } from "@/components/graph/GraphToolbar"
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel"
import { MOCK_GRAPH_DATA } from "@/mocks/fixtures/graph.fixture"

const BusinessGraph = dynamic(
  () => import("@/components/graph/BusinessGraph"),
  { ssr: false }
)

type GraphElement = { data: Record<string, string> | Record<string, unknown>; classes?: string }

export default function GraphPage() {
  const coreRef = React.useRef<unknown>(null)
  const [nodeData, setNodeData] = React.useState<Record<string, unknown> | null>(null)
  const [showOnlyBottlenecks, setShowOnlyBottlenecks] = React.useState(false)
  const [showOnlyCritical, setShowOnlyCritical] = React.useState(false)

  const elements = React.useMemo<GraphElement[]>(() => {
    const bottleneckNodeIds = new Set(["task_t3"])
    const criticalEdgeIds = new Set(["e1", "e2", "e6", "e14"])

    return [
      ...MOCK_GRAPH_DATA.nodes.map((node) => ({
        ...node,
        classes: bottleneckNodeIds.has(node.data.id) ? "bottleneck" : "",
      })),
      ...MOCK_GRAPH_DATA.edges.map((edge) => ({
        ...edge,
        classes: criticalEdgeIds.has(edge.data.id) ? "critical-path" : "",
      })),
    ]
  }, [])

  const runOnCy = (fn: (cy: Record<string, unknown>) => void) => {
    const cy = coreRef.current as Record<string, unknown> | null
    if (!cy) return
    fn(cy)
  }

  return (
    <PageTransition className="-mx-6 -my-6 h-[calc(100vh-56px)] overflow-hidden">
      <div className="relative h-full w-full">
        <BusinessGraph
          elements={elements}
          onNodeClick={setNodeData}
          onCoreRef={(core) => {
            coreRef.current = core as unknown
          }}
        />

        <GraphToolbar
          onZoomIn={() => runOnCy((cy) => (cy.zoom as (value?: number) => number)((cy.zoom as () => number)() * 1.15))}
          onZoomOut={() => runOnCy((cy) => (cy.zoom as (value?: number) => number)((cy.zoom as () => number)() * 0.85))}
          onFit={() => runOnCy((cy) => (cy.fit as () => void)())}
          onToggleBottlenecks={() => {
            setShowOnlyBottlenecks((prev) => !prev)
            runOnCy((cy) => {
              const next = !showOnlyBottlenecks
              ;(cy.nodes as (selector?: string) => { show: () => void; hide: () => void })().show()
              if (next) {
                ;(cy.nodes as (selector?: string) => { hide: () => void; show: () => void })('node[type != "task"], node[type = "task"]:not(.bottleneck)').hide()
              }
            })
          }}
          onToggleCriticalPath={() => {
            setShowOnlyCritical((prev) => !prev)
            runOnCy((cy) => {
              const next = !showOnlyCritical
              ;(cy.edges as (selector?: string) => { show: () => void; hide: () => void })().show()
              if (next) {
                ;(cy.edges as (selector?: string) => { hide: () => void })("edge:not(.critical-path)").hide()
              }
            })
          }}
          onExport={() =>
            runOnCy((cy) => {
              const png = (cy.png as () => string)()
              const anchor = document.createElement("a")
              anchor.href = png
              anchor.download = "sentient-business-graph.png"
              anchor.click()
            })
          }
        />

        <div className="absolute bottom-6 left-6 z-30 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 backdrop-blur-xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-3)]">
            Legend
          </p>
          <div className="space-y-1.5 text-xs text-foreground">
            <div className="flex items-center gap-2"><span className="inline-block size-2 rounded-full bg-primary" />User</div>
            <div className="flex items-center gap-2"><span className="inline-block size-2 rounded-full bg-secondary" />Project</div>
            <div className="flex items-center gap-2"><span className="inline-block size-2 rounded-full bg-[var(--amber)]" />Task</div>
            <div className="flex items-center gap-2"><span className="inline-block size-2 rounded-full bg-[var(--foreground)]" />Agent</div>
          </div>
        </div>

        <button
          className="absolute bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-xs font-medium text-foreground backdrop-blur-xl hover:bg-[var(--surface-2)]"
          onClick={() =>
            runOnCy((cy) => {
              const png = (cy.png as () => string)()
              const anchor = document.createElement("a")
              anchor.href = png
              anchor.download = "sentient-business-graph.png"
              anchor.click()
            })
          }
        >
          <Download className="size-3.5" />
          Export
        </button>

        <NodeDetailPanel nodeData={nodeData} onClose={() => setNodeData(null)} />
      </div>
    </PageTransition>
  )
}
