"use client"

import * as React from "react"
import { useTheme } from "next-themes"

// Import cytoscape without types locally as we don't need strict typing for the wrapper logic
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

  // Colors based on Sentient PRD
  const bg = isDark ? '#1A201D' : '#EBF0EC'
  const text = isDark ? '#EDEDED' : '#171717'
  const mutedText = isDark ? '#A1A1AA' : '#52525B'
  const primary = '#3b82f6'
  const secondary = '#8b5cf6'
  const amber = '#f59e0b'
  const red = '#ef4444'
  const border = isDark ? '#27272a' : '#e5e5e5'

  const stylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': '#1f2937', // surface-2 fallback
        'border-width': 2,
        'border-color': border,
        'label': 'data(label)',
        'color': text,
        'font-family': 'Geist, sans-serif',
        'font-size': '12px',
        'font-weight': '600',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        'width': 40,
        'height': 40,
        'transition-property': 'background-color, border-color, width, height',
        'transition-duration': '0.2s'
      }
    },
    {
      selector: 'node[type = "user"]',
      style: {
        'background-color': primary,
        'border-color': '#2563eb'
      }
    },
    {
      selector: 'node[type = "agent"]',
      style: {
        'background-color': amber,
        'border-color': '#d97706'
      }
    },
    {
      selector: 'node[type = "project"]',
      style: {
        'background-color': secondary,
        'border-color': '#7c3aed',
        'shape': 'round-rectangle',
        'width': 50,
        'height': 50
      }
    },
    {
      selector: 'node[type = "workspace"]',
      style: {
        'background-color': 'transparent',
        'border-color': mutedText,
        'border-style': 'dashed',
        'shape': 'round-rectangle',
        'width': 60,
        'height': 60
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': text
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': border,
        'target-arrow-color': border,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'color': mutedText,
        'text-rotation': 'autorotate',
        'text-margin-y': -10
      }
    },
    {
      selector: '.bottleneck',
      style: {
        'border-color': red,
        'border-width': 4,
        'background-color': '#7f1d1d',
        'width': 55,
        'height': 55,
        'text-outline-color': red,
        'text-outline-width': 1
      }
    },
    {
      selector: '.critical-path',
      style: {
        'line-color': red,
        'target-arrow-color': red,
        'width': 3,
        'line-style': 'dashed'
      }
    }
  ]

  const layout = {
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 60,
    edgeSep: 30,
    rankSep: 80,
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
          
          // Hover effects
          cy.on('mouseover', 'node', (e: any) => {
            document.body.style.cursor = 'pointer'
            e.target.style({ 'border-width': 4 })
          })
          cy.on('mouseout', 'node', (e: any) => {
            document.body.style.cursor = 'default'
            e.target.style({ 'border-width': 2 })
          })
        }}
      />
    </div>
  )
}
