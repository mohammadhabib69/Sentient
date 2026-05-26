"use client"

import * as React from "react"
import { PageTransition } from "@/components/shared/PageTransition"
import { FolderOpen, Bot, AlertTriangle, CheckCircle, User, Database, Plus, Minus, Maximize, Filter, History, Terminal } from "lucide-react"

export default function GraphPage() {
  return (
    <PageTransition className="-mx-6 -my-6 h-[calc(100vh-56px)] relative overflow-hidden bg-surface-dim">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-node {
            0% { box-shadow: 0 0 0 0 rgba(170, 204, 211, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(170, 204, 211, 0); }
            100% { box-shadow: 0 0 0 0 rgba(170, 204, 211, 0); }
        }
        .pulse-active {
            animation: pulse-node 2s infinite;
        }

        @keyframes pulse-error {
            0% { box-shadow: 0 0 0 0 rgba(192, 80, 74, 0.6); }
            70% { box-shadow: 0 0 0 15px rgba(192, 80, 74, 0); }
            100% { box-shadow: 0 0 0 0 rgba(192, 80, 74, 0); }
        }
        .pulse-error-active {
            animation: pulse-error 1.5s infinite;
        }

        @keyframes dash {
            to { stroke-dashoffset: -16; }
        }
        .animated-line {
            stroke-dasharray: 6 6;
            stroke-dashoffset: 0;
            animation: dash 1s linear infinite;
        }
        
        .animated-line-error {
            stroke-dasharray: 6 6;
            stroke-dashoffset: 0;
            animation: dash 0.5s linear infinite;
        }
      `}} />

      {/* Graph Canvas Area */}
      <div className="absolute inset-0 z-0">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(theme('colors.outline-variant') 1px, transparent 1px)", backgroundSize: "32px 32px", backgroundPosition: "center center" }}></div>
          
          {/* Edges (SVG Lines) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                  <linearGradient id="edge-active" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#aaccd3" stopOpacity="0.8"></stop>
                      <stop offset="100%" stopColor="#74959B" stopOpacity="0.2"></stop>
                  </linearGradient>
                  <linearGradient id="edge-error" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C0504A" stopOpacity="0.9"></stop>
                      <stop offset="100%" stopColor="#aaccd3" stopOpacity="0.2"></stop>
                  </linearGradient>
              </defs>
              {/* Connections to Central Project */}
              <line className="animated-line" stroke="url(#edge-active)" strokeWidth="2" x1="50%" y1="50%" x2="25%" y2="30%"></line>
              <line stroke="#414849" strokeWidth="1.5" x1="50%" y1="50%" x2="75%" y2="25%"></line>
              <line className="animated-line" stroke="url(#edge-active)" strokeWidth="2" x1="50%" y1="50%" x2="80%" y2="65%"></line>
              
              {/* Bottleneck Connection */}
              <line className="animated-line-error" stroke="url(#edge-error)" strokeWidth="2.5" x1="50%" y1="50%" x2="35%" y2="75%"></line>
              
              {/* Inter-node connections */}
              <line stroke="#414849" strokeWidth="1" x1="25%" y1="30%" x2="15%" y2="45%"></line>
              <line stroke="#414849" strokeWidth="1" x1="75%" y1="25%" x2="85%" y2="40%"></line>
              <line stroke="#414849" strokeWidth="1" x1="80%" y1="65%" x2="65%" y2="85%"></line>
              <line className="animated-line-error opacity-50" stroke="#C0504A" strokeWidth="1" x1="35%" y1="75%" x2="20%" y2="85%"></line>
          </svg>

          {/* Nodes */}
          {/* Central Project Node */}
          <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_32px_rgba(170,204,211,0.2)] flex items-center justify-center pulse-active transition-transform duration-300 group-hover:scale-105 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-full bg-primary border-2 border-surface-dim shadow-[0_0_16px_rgba(170,204,211,0.6)] flex items-center justify-center">
                      <FolderOpen className="text-on-primary size-7" />
                  </div>
              </div>
              <div className="flex flex-col items-center">
                  <span className="bg-surface-container-high/90 backdrop-blur-md border border-outline-variant px-3 py-1.5 rounded-lg text-sm font-headline-xl text-on-surface shadow-lg">Project Nexus</span>
                  <span className="text-[10px] font-mono-xs text-secondary mt-1 bg-surface-dim/80 px-2 rounded-full border border-secondary/20">Active</span>
              </div>
          </div>

          {/* Agent Nodes */}
          <div className="absolute top-[30%] left-[25%] transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1.5 cursor-pointer hover:z-30 group">
              <div className="w-12 h-12 rounded-full bg-forest-green border-2 border-surface-dim shadow-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <Bot className="text-on-primary size-5" />
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-xs font-body-sm font-medium text-on-surface bg-surface-container/80 backdrop-blur-sm px-2 py-0.5 border border-glass-border rounded shadow-sm">Agent: Extractor</span>
                  <span className="text-[9px] font-mono-xs text-on-surface-variant">Idle</span>
              </div>
          </div>

          <div className="absolute top-[65%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1.5 cursor-pointer hover:z-30 group">
              <div className="w-12 h-12 rounded-full bg-forest-green border-2 border-surface-dim shadow-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <Bot className="text-on-primary size-5" />
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-xs font-body-sm font-medium text-on-surface bg-surface-container/80 backdrop-blur-sm px-2 py-0.5 border border-glass-border rounded shadow-sm">Agent: Synthesizer</span>
                  <span className="text-[9px] font-mono-xs text-secondary">Processing (85%)</span>
              </div>
          </div>

          {/* Task Nodes (Including Bottleneck) */}
          <div className="absolute top-[75%] left-[35%] transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 cursor-pointer hover:z-30 group">
              <div className="w-10 h-10 rounded-full bg-error-red border-2 border-surface-dim shadow-[0_0_24px_rgba(192,80,74,0.5)] flex items-center justify-center transition-transform duration-200 group-hover:scale-110 pulse-error-active">
                  <AlertTriangle className="text-white size-5" />
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-xs font-body-sm font-medium text-error-red bg-error-container/80 backdrop-blur-sm px-2 py-0.5 border border-error-red/30 rounded shadow-sm">Data Sync Failed</span>
                  <span className="text-[9px] font-mono-xs text-error-red">BOTTLENECK</span>
              </div>
          </div>

          <div className="absolute top-[25%] left-[75%] transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1.5 cursor-pointer hover:z-30 group">
              <div className="w-10 h-10 rounded-full bg-mist-teal border-2 border-surface-dim shadow-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <CheckCircle className="text-surface size-5" />
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-xs font-body-sm font-medium text-on-surface bg-surface-container/80 backdrop-blur-sm px-2 py-0.5 border border-glass-border rounded shadow-sm">Index Update</span>
                  <span className="text-[9px] font-mono-xs text-on-surface-variant">Completed</span>
              </div>
          </div>

          {/* User Nodes */}
          <div className="absolute top-[45%] left-[15%] transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 cursor-pointer hover:z-30 group">
              <div className="w-8 h-8 rounded-full bg-secondary border-2 border-surface-dim shadow-md flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <User className="text-on-secondary size-4" />
              </div>
              <span className="text-[10px] font-mono-xs text-on-surface-variant bg-surface-dim/60 px-1.5 rounded">User_A</span>
          </div>

          <div className="absolute top-[40%] left-[85%] transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 cursor-pointer hover:z-30 group">
              <div className="w-8 h-8 rounded-full bg-secondary border-2 border-surface-dim shadow-md flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <User className="text-on-secondary size-4" />
              </div>
              <span className="text-[10px] font-mono-xs text-on-surface-variant bg-surface-dim/60 px-1.5 rounded">User_B</span>
          </div>

          <div className="absolute top-[85%] left-[65%] transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 cursor-pointer hover:z-30 group">
              <div className="w-8 h-8 rounded-full bg-amber-alert border-2 border-surface-dim shadow-md flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <Database className="text-surface size-4" />
              </div>
              <span className="text-[10px] font-mono-xs text-on-surface-variant bg-surface-dim/60 px-1.5 rounded">Dataset_Core</span>
          </div>

          <div className="absolute top-[85%] left-[20%] transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 cursor-pointer hover:z-30 group">
              <div className="w-8 h-8 rounded-full bg-amber-alert border-2 border-surface-dim shadow-md flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <Database className="text-surface size-4" />
              </div>
              <span className="text-[10px] font-mono-xs text-on-surface-variant bg-surface-dim/60 px-1.5 rounded">External_DB</span>
          </div>
      </div>

      {/* Floating Overlays */}
      
      {/* Top-Right Toolbar */}
      <div className="absolute top-6 right-6 z-40 flex flex-col gap-2 p-1.5 bg-surface-container-high/60 backdrop-blur-xl border border-glass-border rounded-xl shadow-2xl">
          <button className="p-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors" title="Zoom In">
              <Plus className="size-5" />
          </button>
          <button className="p-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors" title="Zoom Out">
              <Minus className="size-5" />
          </button>
          <div className="w-full h-px bg-outline-variant/50 my-0.5"></div>
          <button className="p-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors" title="Fit to Screen">
              <Maximize className="size-5" />
          </button>
          <button className="p-2.5 text-mist-teal hover:text-primary hover:bg-surface-container-highest rounded-lg transition-colors" title="Filter Nodes">
              <Filter className="size-5" />
          </button>
      </div>

      {/* Right-Side Node Detail Panel */}
      <div className="absolute top-6 left-6 w-[340px] z-40 flex flex-col bg-surface-container-low/85 backdrop-blur-2xl border border-glass-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="p-5 border-b border-outline-variant/50 flex items-start justify-between bg-gradient-to-b from-surface-container-high/50 to-transparent">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <FolderOpen className="text-primary size-6" />
                  </div>
                  <div>
                      <h3 className="font-headline-xl text-xl text-on-surface leading-tight font-semibold">Project Nexus</h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="w-2 h-2 rounded-full bg-error-red pulse-error-active"></span>
                          <span className="text-xs font-mono-xs text-error-red">Degraded State</span>
                      </div>
                  </div>
              </div>
          </div>
          
          <div className="p-5 flex flex-col gap-5">
              {/* Diagnostics */}
              <div className="bg-surface-container/50 rounded-xl p-4 border border-outline-variant/30">
                  <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-label-caps text-on-surface-variant uppercase tracking-wider">Health Score</span>
                      <span className="text-xl font-mono-xs text-amber-alert font-bold">78%</span>
                  </div>
                  <div className="w-full bg-surface-dim rounded-full h-1.5">
                      <div className="bg-amber-alert h-1.5 rounded-full" style={{ width: '78%' }}></div>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 bg-surface-container/30 p-3 rounded-xl border border-outline-variant/20">
                      <span className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">Connected Nodes</span>
                      <span className="text-lg font-mono-xs text-on-surface">14 <span className="text-xs text-on-surface-variant ml-1">Total</span></span>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-error-container/10 p-3 rounded-xl border border-error-red/20">
                      <span className="text-[10px] font-label-caps text-error-red uppercase tracking-wider">Critical Paths</span>
                      <span className="text-lg font-mono-xs text-error-red">1 <span className="text-xs text-error-red/70 ml-1">Flagged</span></span>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-surface-container/30 p-3 rounded-xl border border-outline-variant/20">
                      <span className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">Agents Active</span>
                      <span className="text-lg font-mono-xs text-forest-green">2</span>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-surface-container/30 p-3 rounded-xl border border-outline-variant/20">
                      <span className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">Network Load</span>
                      <span className="text-lg font-mono-xs text-on-surface">42%</span>
                  </div>
              </div>
              
              <div className="h-px w-full bg-outline-variant/30"></div>
              
              <div>
                  <h4 className="text-[11px] font-label-caps text-on-surface-variant mb-3 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="size-3.5" /> Active Bottlenecks
                  </h4>
                  <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container border border-error-red/30 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-error-red"></div>
                          <div className="flex justify-between items-center">
                              <span className="text-xs font-body-sm font-medium text-on-surface">Data Sync Failed</span>
                              <span className="text-[10px] font-mono-xs text-error-red">T-2m</span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant leading-relaxed">Task blocked due to timeout in External_DB connection. Agent synthesizer stalled.</span>
                      </div>
                  </div>
              </div>
          </div>
          
          <div className="p-4 bg-surface-container-highest/50 border-t border-outline-variant/30 flex justify-between items-center rounded-b-2xl">
              <button className="text-xs font-body-sm text-mist-teal hover:text-primary transition-colors flex items-center gap-1">
                  <History className="size-4" />
                  View Logs
              </button>
              <button className="px-5 py-2 bg-mist-teal/10 text-mist-teal border border-mist-teal/30 hover:bg-mist-teal hover:text-surface rounded-lg text-xs font-body-sm font-semibold transition-all shadow-sm">
                  Resolve Issue
              </button>
          </div>
      </div>

      {/* Mini Legend (Bottom-Left) */}
      <div className="absolute bottom-6 left-6 z-40 bg-surface-container-high/60 backdrop-blur-xl border border-glass-border rounded-xl p-4 flex flex-col gap-3 shadow-2xl">
          <span className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider mb-1">Network Legend</span>
          <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-primary border border-primary/50 shadow-[0_0_8px_rgba(170,204,211,0.5)]"></div>
              <span className="text-xs font-mono-xs text-on-surface">Projects</span>
          </div>
          <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-forest-green"></div>
              <span className="text-xs font-mono-xs text-on-surface">AI Agents</span>
          </div>
          <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-mist-teal"></div>
              <span className="text-xs font-mono-xs text-on-surface">Tasks</span>
          </div>
          <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <span className="text-xs font-mono-xs text-on-surface">Users</span>
          </div>
          <div className="flex items-center gap-3 mt-1 pt-2 border-t border-outline-variant/30">
              <div className="w-3 h-3 rounded-full bg-error-red pulse-error-active"></div>
              <span className="text-xs font-mono-xs text-error-red">Critical Issue</span>
          </div>
      </div>

      {/* Universal Command Bar (Bottom-Center) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-[32rem] max-w-[90vw]">
          <div className="flex items-center bg-surface-container-highest/80 backdrop-blur-2xl border border-glass-border rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] px-5 py-3 focus-within:border-mist-teal/70 focus-within:ring-2 focus-within:ring-mist-teal/20 transition-all duration-300">
              <Terminal className="text-mist-teal size-6 mr-3" />
              <input className="bg-transparent outline-none border-none focus:ring-0 text-sm font-mono-xs text-on-surface placeholder-on-surface-variant w-full h-8" placeholder="Query network (e.g., /isolate bottlenecks, /spawn agent)..." type="text" />
              <div className="flex items-center gap-1.5 ml-3 opacity-60 shrink-0">
                  <kbd className="text-[11px] font-mono-xs border border-outline-variant/60 rounded-md px-2 py-1 bg-surface-container text-on-surface-variant shadow-sm">⌘</kbd>
                  <kbd className="text-[11px] font-mono-xs border border-outline-variant/60 rounded-md px-2 py-1 bg-surface-container text-on-surface-variant shadow-sm">K</kbd>
              </div>
          </div>
      </div>
    </PageTransition>
  )
}
