"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { MOCK_GRAPH_DATA } from "@/mocks/fixtures/graph.fixture"
import { GraphToolbar } from "@/components/graph/GraphToolbar"
import { PageTransition } from "@/components/shared/PageTransition"
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel"

// Dynamically import Cytoscape so we don't break SSR (canvas requires window)
const BusinessGraph = dynamic(() => import("@/components/graph/BusinessGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--surface-1)]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))]/20 border-t-[hsl(var(--primary))]" />
        <p className="text-sm font-medium text-[var(--foreground-3)]">Initializing Reality Topology...</p>
      </div>
    </div>
  )
})

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = React.useState<any | null>(null)
  const cyRef = React.useRef<any>(null)

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)
  const handleFit = () => cyRef.current?.fit()
  const handleCenter = () => cyRef.current?.center()

  const handleToggleBottlenecks = () => {
    if (!cyRef.current) return
    const cy = cyRef.current
    
    // Toggle class on mock bottleneck nodes
    const taskNodes = cy.nodes('[type = "task"]')
    taskNodes.toggleClass('bottleneck')
    
    // Toggle critical path edges connected to them
    const edges = taskNodes.connectedEdges()
    edges.toggleClass('critical-path')
  }

  return (
    <PageTransition className="absolute inset-0 top-[56px] overflow-hidden">
      <BusinessGraph 
        elements={CytoscapeElements} 
        onNodeClick={setSelectedNode}
        onCoreRef={(core) => cyRef.current = core}
      />
      
      <GraphToolbar 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onCenter={handleCenter}
        onToggleBottlenecks={handleToggleBottlenecks}
      />

      <NodeDetailPanel 
        nodeData={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />
    </PageTransition>
  )
}

// Convert MOCK_GRAPH_DATA to array of elements for react-cytoscapejs
const CytoscapeElements = [
  ...MOCK_GRAPH_DATA.nodes,
  ...MOCK_GRAPH_DATA.edges
]
