"use client"

import * as React from "react"
import { useTheme } from "next-themes"

// Import cytoscape components
// @ts-ignore
import CytoscapeComponent from "react-cytoscapejs"
// @ts-ignore
import cytoscape from "cytoscape"
// @ts-ignore
import dagre from "cytoscape-dagre"

cytoscape.use(dagre)

interface BusinessGraphProps {
  elements: any[]
  onNodeClick: (nodeData: any) => void
  onCoreRef: (core: any) => void
}

export default function BusinessGraph({ elements, onNodeClick, onCoreRef }: BusinessGraphProps) {
  const { theme } = useTheme()
  const isDark = theme !== 'light'

  // Colors based on Sentient PRD Design System
  const bg = isDark ? '#121413' : '#EBF0EC'
  const textColor = isDark ? '#E8EDE9' : '#1E201F'
  const border = isDark ? 'rgba(116,149,155,0.18)' : '#DDE6E0'
  const primaryColor = '#74959B' // Mist Teal
  const secondaryColor = '#49776B' // Forest Green
  const amberColor = '#D4874A'
  const redColor = '#C0504A'

  const stylesheet = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'color': textColor,
        'font-family': 'Geist, sans-serif',
        'font-size': '11px',
        'font-weight': '600',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        'transition-property': 'background-color, border-color, width, height, shadow-blur',
        'transition-duration': '0.25s'
      }
    },
    // User nodes: small ~40px, fill: rgba(116,149,155,0.80), border: 2px #74959B
    {
      selector: 'node[type = "user"]',
      style: {
        'width': 40,
        'height': 40,
        'background-color': 'rgba(116,149,155,0.80)',
        'border-width': 2,
        'border-color': primaryColor,
        'shape': 'ellipse'
      }
    },
    // Project nodes: medium ~56px, fill: rgba(73,119,107,0.80), border: 2px #49776B
    {
      selector: 'node[type = "project"]',
      style: {
        'width': 56,
        'height': 56,
        'background-color': 'rgba(73,119,107,0.80)',
        'border-width': 2,
        'border-color': secondaryColor,
        'shape': 'round-rectangle'
      }
    },
    // Task nodes: small ~32px, fill: rgba(212,135,74,0.70), border: 2px #D4874A
    {
      selector: 'node[type = "task"]',
      style: {
        'width': 32,
        'height': 32,
        'background-color': 'rgba(212,135,74,0.70)',
        'border-width': 2,
        'border-color': amberColor,
        'shape': 'ellipse'
      }
    },
    // Agent nodes: medium ~48px, fill: near white ghost-like, border: 2px #E8EDE9 dashed
    {
      selector: 'node[type = "agent"]',
      style: {
        'width': 48,
        'height': 48,
        'background-color': isDark ? 'rgba(232, 237, 233, 0.15)' : 'rgba(30, 32, 31, 0.05)',
        'border-width': 2,
        'border-color': isDark ? '#E8EDE9' : '#1E201F',
        'border-style': 'dashed',
        'shape': 'ellipse'
      }
    },
    // Bottleneck nodes: red glow effect, slightly larger
    {
      selector: 'node.bottleneck',
      style: {
        'width': 64,
        'height': 64,
        'border-color': redColor,
        'border-width': 3,
        'shadow-color': redColor,
        'shadow-blur': 16,
        'shadow-opacity': 0.8,
        'shadow-offset-x': 0,
        'shadow-offset-y': 0
      }
    },
    // Selected node highlights
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': textColor
      }
    },
    // Edges default: 1px rgba(116,149,155,0.25)
    {
      selector: 'edge',
      style: {
        'width': 1,
        'line-color': 'rgba(116,149,155,0.25)',
        'target-arrow-color': 'rgba(116,149,155,0.25)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8
      }
    },
    // DEPENDS_ON edge: dashed line
    {
      selector: 'edge[type = "depends"]',
      style: {
        'line-style': 'dashed',
        'width': 1.5
      }
    },
    // MONITORED_BY edge: 1px dashed secondary color
    {
      selector: 'edge[type = "monitored"]',
      style: {
        'line-color': 'rgba(73,119,107,0.4)',
        'target-arrow-color': 'rgba(73,119,107,0.4)',
        'line-style': 'dashed',
        'width': 1
      }
    },
    // Critical path edge: 2px dashed animated line in primary
    {
      selector: 'edge.critical-path',
      style: {
        'line-color': primaryColor,
        'target-arrow-color': primaryColor,
        'width': 2.5,
        'line-style': 'dashed'
      }
    }
  ]

  const layout = {
    name: 'dagre',
    rankDir: 'LR', // Left to Right flow feels more timeline-like
    nodeSep: 60,
    edgeSep: 35,
    rankSep: 90,
    animate: true
  }

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: bg }}>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={stylesheet}
        layout={layout}
        cy={(cy: any) => {
          onCoreRef(cy)
          
          cy.on('tap', 'node', (evt: any) => {
            const node = evt.target
            onNodeClick(node.data())
          })
          
          // Hover cursor effects
          cy.on('mouseover', 'node', (e: any) => {
            document.body.style.cursor = 'pointer'
          })
          cy.on('mouseout', 'node', (e: any) => {
            document.body.style.cursor = 'default'
          })
        }}
      />
    </div>
  )
}
