"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { PageTransition } from "@/components/shared/PageTransition"
import { GraphToolbar } from "@/components/graph/GraphToolbar"
import { GraphStatusPanel } from "@/components/graph/GraphStatusPanel"
import { GraphLegend } from "@/components/graph/GraphLegend"
import { GraphCommandBar } from "@/components/graph/GraphCommandBar"
import { MOCK_GRAPH_DATA } from "@/mocks/fixtures/graph.fixture"

const BusinessGraph = dynamic(
  () => import("@/components/graph/BusinessGraph"),
  { ssr: false }
)

type GraphElement = { data: Record<string, string> | Record<string, unknown>; classes?: string }

export default function GraphPage() {
  const coreRef = React.useRef<unknown>(null)

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
    <PageTransition className="-mx-6 -my-6 h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="relative h-full w-full bg-surface-dim">
        <div className="graph-grid-bg pointer-events-none absolute inset-0 opacity-[0.15]" />
        <BusinessGraph
          elements={elements}
          onNodeClick={() => {}}
          onCoreRef={(core) => {
            coreRef.current = core as unknown
          }}
        />

        <GraphStatusPanel />
        <GraphLegend />
        <GraphCommandBar />
        <GraphToolbar
          onZoomIn={() =>
            runOnCy((cy) =>
              (cy.zoom as (value?: number) => number)((cy.zoom as () => number)() * 1.15)
            )
          }
          onZoomOut={() =>
            runOnCy((cy) =>
              (cy.zoom as (value?: number) => number)((cy.zoom as () => number)() * 0.85)
            )
          }
          onFit={() => runOnCy((cy) => (cy.fit as () => void)())}
        />
      </div>
    </PageTransition>
  )
}
