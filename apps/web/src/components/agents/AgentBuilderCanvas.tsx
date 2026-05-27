"use client";

import React, { useCallback, useState, useMemo, useEffect } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
  Panel,
  Handle,
  Position,
  Edge,
  Node,
  Connection,
  OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Clock,
  Zap,
  GitBranch,
  Sparkles,
  Mail,
  CheckSquare,
  UserCheck,
  MessageSquare,
  Webhook,
  Brain,
  GripVertical,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Trash2,
  X,
  ChevronDown,
  Settings,
  Sliders,
  Database,
  Play,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Custom Node Components ────────────────────────────────────

// 1. Trigger Node Component
function TriggerNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div
      className={`w-[220px] rounded-xl overflow-hidden shadow-lg border transition-all duration-200 ${
        selected
          ? "border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]/30 scale-[1.02]"
          : "border-border bg-card"
      }`}
    >
      <div className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 flex items-center gap-2 text-xs font-semibold">
        <Clock className="size-3.5" />
        <span>{data.label || "Schedule Trigger"}</span>
      </div>
      <div className="p-3 bg-[var(--surface-1)] text-xs text-foreground font-medium">
        {data.body || "Every weekday at 9:00 AM"}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-blue-600 !border-2 !border-white dark:!border-[#16191A] !-mr-1.5"
      />
    </div>
  );
}

// 2. Condition Node Component
function ConditionNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div
      className={`w-[220px] rounded-xl overflow-hidden shadow-lg border transition-all duration-200 relative ${
        selected
          ? "border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]/30 scale-[1.02]"
          : "border-border bg-card"
      }`}
    >
      <div className="bg-amber-600 dark:bg-amber-500 text-white px-3 py-2 flex items-center gap-2 text-xs font-semibold">
        <GitBranch className="size-3.5" />
        <span>{data.label || "If / Else"}</span>
      </div>
      <div className="p-3 bg-[var(--surface-1)] text-xs text-foreground font-medium pb-7">
        {data.body || "IF overdue_tasks > 0"}
      </div>

      <div className="absolute right-3.5 bottom-7 flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
        True ✓
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-600 dark:text-red-400">
        False ✗
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-amber-600 !border-2 !border-white dark:!border-[#16191A] !-ml-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-white dark:!border-[#16191A] !-mr-1.5"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-3 !h-3 !bg-red-600 !border-2 !border-white dark:!border-[#16191A] !-mb-1.5"
      />
    </div>
  );
}

// 3. AI Prompt Node Component
function AIPromptNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div
      className={`w-[220px] rounded-xl overflow-hidden shadow-lg border transition-all duration-200 ${
        selected
          ? "border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]/30 scale-[1.02]"
          : "border-border bg-card"
      }`}
    >
      <div className="bg-[hsl(var(--primary))] text-white px-3 py-2 flex items-center gap-2 text-xs font-semibold">
        <Sparkles className="size-3.5" />
        <span>{data.label || "Run AI Prompt"}</span>
      </div>
      <div className="p-3 bg-[var(--surface-1)] text-xs text-foreground font-medium leading-relaxed">
        {data.body || "Analyze overdue tasks and suggest reassignment"}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-[hsl(var(--primary))] !border-2 !border-white dark:!border-[#16191A] !-ml-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[hsl(var(--primary))] !border-2 !border-white dark:!border-[#16191A] !-mr-1.5"
      />
    </div>
  );
}

// 4. Action Node Component
function ActionNode({ data, selected }: { data: any; selected?: boolean }) {
  const renderBody = (body: string) => {
    if (!body) return "";
    const parts = body.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, idx) => {
      if (part.startsWith("{{") && part.endsWith("}}")) {
        return (
          <span
            key={idx}
            className="inline-block bg-[hsl(var(--primary))]/12 text-[hsl(var(--primary))] px-1 py-0.5 rounded font-mono text-[10px] border border-[hsl(var(--primary))]/20"
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("email")) return <Mail className="size-3.5" />;
    if (l.includes("slack")) return <MessageSquare className="size-3.5" />;
    if (l.includes("webhook")) return <Webhook className="size-3.5" />;
    if (l.includes("reassign")) return <UserCheck className="size-3.5" />;
    return <CheckSquare className="size-3.5" />;
  };

  return (
    <div
      className={`w-[220px] rounded-xl overflow-hidden shadow-lg border transition-all duration-200 ${
        selected
          ? "border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))]/30 scale-[1.02]"
          : "border-border bg-card"
      }`}
    >
      <div className="bg-emerald-700 dark:bg-emerald-600 text-white px-3 py-2 flex items-center gap-2 text-xs font-semibold">
        {getIcon(data.label)}
        <span>{data.label || "Action"}</span>
      </div>
      <div className="p-3 bg-[var(--surface-1)] text-xs text-foreground font-medium leading-relaxed">
        {renderBody(data.body)}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-white dark:!border-[#16191A] !-ml-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-white dark:!border-[#16191A] !-mr-1.5"
      />
    </div>
  );
}

const nodeTypes = {
  triggerNode: TriggerNode,
  conditionNode: ConditionNode,
  aiPromptNode: AIPromptNode,
  actionNode: ActionNode,
};

// ─── Preloaded Sample Flow ─────────────────────────────────────
const initialNodes: Node[] = [
  {
    id: "node-1",
    type: "triggerNode",
    position: { x: 50, y: 150 },
    data: { label: "Schedule Trigger", body: "Every weekday at 9:00 AM" },
  },
  {
    id: "node-2",
    type: "conditionNode",
    position: { x: 350, y: 150 },
    data: { label: "If / Else", body: "IF overdue_tasks > 0" },
  },
  {
    id: "node-3",
    type: "aiPromptNode",
    position: {
      x: 650,
      y: 50,
    },
    data: {
      label: "Run AI Prompt",
      body: "Analyze overdue tasks and suggest reassignment",
      model: "GPT-4o",
      systemPrompt:
        "You are a helpful AI coordinator. Analyze the overdue tasks and reassign them to the best suited team member based on past workload and expertise.",
      userPrompt: "Please analyze these overdue tasks: {{overdue_tasks}}. Suggest reassignment.",
      outputVar: "{{ai_suggestion}}",
      temperature: 0.7,
    },
  },
  {
    id: "node-4",
    type: "actionNode",
    position: { x: 950, y: 50 },
    data: { label: "Reassign Task", body: "Reassign to: {{ai_suggestion.assignee}}", icon: "🤖" },
  },
  {
    id: "node-5",
    type: "actionNode",
    position: { x: 650, y: 300 },
    data: {
      label: "Send Email",
      body: "To: manager@company.com · Subject: All tasks on track ✓",
      icon: "✉️",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "edge-1-2",
    source: "node-1",
    sourceHandle: "output",
    target: "node-2",
    targetHandle: "input",
    className: "animated-flow",
  },
  {
    id: "edge-2-3",
    source: "node-2",
    sourceHandle: "true",
    target: "node-3",
    targetHandle: "input",
    className: "animated-flow",
  },
  {
    id: "edge-3-4",
    source: "node-3",
    sourceHandle: "output",
    target: "node-4",
    targetHandle: "input",
    className: "animated-flow",
  },
  {
    id: "edge-2-5",
    source: "node-2",
    sourceHandle: "false",
    target: "node-5",
    targetHandle: "input",
    className: "animated-flow-false",
  },
];

// ─── Inner Canvas Component ─────────────────────────────────────
function CanvasContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  // History stack for Undo/Redo
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);

  // Capture state snapshot before major edits
  const saveStateToHistory = useCallback(() => {
    // Deep clone nodes and edges
    const nodesCopy = JSON.parse(JSON.stringify(nodes));
    const edgesCopy = JSON.parse(JSON.stringify(edges));
    setHistory((prev) => [...prev, { nodes: nodesCopy, edges: edgesCopy }]);
    setRedoStack([]); // Clear redo
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((prev) => prev.slice(0, -1));

    const currentNodes = JSON.parse(JSON.stringify(nodes));
    const currentEdges = JSON.parse(JSON.stringify(edges));
    setRedoStack((prev) => [...prev, { nodes: currentNodes, edges: currentEdges }]);

    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [history, nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    if (!next) return;
    setRedoStack((prev) => prev.slice(0, -1));

    const currentNodes = JSON.parse(JSON.stringify(nodes));
    const currentEdges = JSON.parse(JSON.stringify(edges));
    setHistory((prev) => [...prev, { nodes: currentNodes, edges: currentEdges }]);

    setNodes(next.nodes);
    setEdges(next.edges);
  }, [redoStack, nodes, edges, setNodes, setEdges]);

  // Connect handler
  const onConnect: OnConnect = useCallback(
    (connection) => {
      saveStateToHistory();
      const edgeColorClass =
        connection.sourceHandle === "false" ? "animated-flow-false" : "animated-flow";
      setEdges((eds) => addEdge({ ...connection, className: edgeColorClass }, eds));
    },
    [setEdges, saveStateToHistory],
  );

  // Drag over handler for canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Drop handler to add a new node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      saveStateToHistory();

      // Categorize and generate properties
      let category = "actionNode";
      let label = type;
      let body = "";

      const triggers = ["Schedule", "Event", "Webhook"];
      const conditions = ["If/Else", "Filter", "Compare"];

      if (triggers.includes(type)) {
        category = "triggerNode";
        label = type === "Schedule" ? "Schedule Trigger" : `${type} Trigger`;
        body = type === "Schedule" ? "Every weekday at 9:00 AM" : `On event stream trigger`;
      } else if (conditions.includes(type)) {
        category = "conditionNode";
        label = type === "If/Else" ? "If / Else" : type;
        body = type === "If/Else" ? "IF overdue_tasks > 0" : `Filter dataset`;
      } else if (type === "Run AI Prompt") {
        category = "aiPromptNode";
        body = "Analyze and output prompt values";
      } else {
        category = "actionNode";
        body =
          type === "Send Email"
            ? "To: manager@company.com · Subject: Alert"
            : type === "Reassign Task"
              ? "Reassign task assignee"
              : `Perform action: ${type}`;
      }

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: category,
        position,
        data: {
          label,
          body,
          model: "GPT-4o",
          systemPrompt: "You are a helpful AI coordinator.",
          userPrompt: "Action user prompt.",
          outputVar: "{{ai_result}}",
          temperature: 0.7,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, saveStateToHistory],
  );

  // Selected node logic
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.selected);
  }, [nodes]);

  // Handler to update values in detail configuration panel
  const updateNodeData = useCallback(
    (key: string, value: any) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === selectedNode.id) {
            // If updating body prompt content, mirror it
            const updatedData = { ...n.data, [key]: value };
            if (key === "userPrompt" || key === "body") {
              updatedData.body = value;
            }
            return {
              ...n,
              data: updatedData,
            };
          }
          return n;
        }),
      );
    },
    [selectedNode, setNodes],
  );

  // Delete selected nodes
  const deleteSelected = useCallback(() => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
    if (selectedIds.length === 0) return;
    saveStateToHistory();
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) =>
      eds.filter((e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target)),
    );
  }, [nodes, setNodes, setEdges, saveStateToHistory]);

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* ── Page Header (above canvas) ── */}
      <header className="h-14 border-b border-[var(--glass-border)] bg-[var(--surface-2)]/90 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
        {/* Left Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-3)] uppercase tracking-wider">
          <span>Agents</span>
          <span className="text-[var(--foreground-3)]/60">→</span>
          <span className="text-[hsl(var(--primary))] font-bold">Builder</span>
        </div>

        {/* Center Title */}
        <h1 className="text-sm font-bold tracking-tight text-foreground">Custom Agent Builder</h1>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="font-semibold">
            Save Draft
          </Button>
          <Button variant="secondary" size="sm" className="font-semibold gap-1.5">
            <Play className="size-3 fill-current" />
            Test
          </Button>
          <Button variant="default" size="sm" className="font-semibold gap-1.5">
            Deploy Agent 🚀
          </Button>
        </div>
      </header>

      {/* ── Content Container (Canvas + Panels) ── */}
      <div className="flex flex-1 relative overflow-hidden bg-[#EAEEF0] dark:bg-[#16191A]">
        {/* CSS keyframes and variables */}
        <style>{`
          .react-flow-canvas-container {
            --grid-color: rgba(22, 25, 26, 0.08);
            --edge-color: #8A9E94;
          }
          .dark .react-flow-canvas-container {
            --grid-color: rgba(255, 255, 255, 0.08);
            --edge-color: #4A5E52;
          }
          .react-flow-canvas-container .react-flow__edge-path {
            stroke: var(--edge-color) !important;
            stroke-width: 2px !important;
          }
          @keyframes flow-dots {
            from {
              stroke-dashoffset: 12;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
          .react-flow-canvas-container .react-flow__edge-path.animated-flow {
            stroke-dasharray: 6 6 !important;
            animation: flow-dots 1s linear infinite !important;
            stroke: hsl(var(--primary)) !important;
          }
          .react-flow-canvas-container .react-flow__edge-path.animated-flow-false {
            stroke-dasharray: 6 6 !important;
            animation: flow-dots 1s linear infinite !important;
            stroke: #A03D38 !important;
          }
        `}</style>

        {/* Left Side: Library Panel */}
        <aside className="w-[240px] border-r border-[var(--glass-border)] bg-[var(--surface-2)]/95 backdrop-blur-xl p-4 flex flex-col gap-5 z-10 select-none overflow-y-auto shrink-0 shadow-lg">
          <div className="flex flex-col">
            <h3 className="text-[11px] font-bold tracking-widest text-[var(--foreground-3)] uppercase">
              NODES
            </h3>
            <p className="text-[10px] text-[var(--foreground-3)]/80 mt-0.5 leading-normal">
              Drag and drop components to create agent workflows.
            </p>
          </div>

          {/* Trigger Section */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-[var(--foreground-2)] tracking-wide uppercase">
              Triggers
            </h4>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Schedule", icon: "⏰" },
                { label: "Event", icon: "📥" },
                { label: "Webhook", icon: "🔗" },
              ].map((item) => (
                <div
                  key={item.label}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/reactflow", item.label);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex items-center justify-between cursor-grab bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-3)] active:cursor-grabbing shadow-sm transition-all group duration-150"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <GripVertical className="size-3.5 text-[var(--foreground-3)]/60 group-hover:text-[var(--foreground-3)]" />
                </div>
              ))}
            </div>
          </div>

          {/* Condition Section */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-[var(--foreground-2)] tracking-wide uppercase">
              Conditions
            </h4>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "If/Else", icon: "⚖️" },
                { label: "Filter", icon: "🔍" },
                { label: "Compare", icon: "🔢" },
              ].map((item) => (
                <div
                  key={item.label}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/reactflow", item.label);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex items-center justify-between cursor-grab bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-3)] active:cursor-grabbing shadow-sm transition-all group duration-150"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <GripVertical className="size-3.5 text-[var(--foreground-3)]/60 group-hover:text-[var(--foreground-3)]" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Section */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-[var(--foreground-2)] tracking-wide uppercase">
              Actions
            </h4>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Send Email", icon: "✉️" },
                { label: "Create Task", icon: "📋" },
                { label: "Reassign Task", icon: "🔁" },
                { label: "Post to Slack", icon: "💬" },
                { label: "Call Webhook", icon: "🔗" },
                { label: "Run AI Prompt", icon: "🤖" },
              ].map((item) => (
                <div
                  key={item.label}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/reactflow", item.label);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex items-center justify-between cursor-grab bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-3)] active:cursor-grabbing shadow-sm transition-all group duration-150"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <GripVertical className="size-3.5 text-[var(--foreground-3)]/60 group-hover:text-[var(--foreground-3)]" />
                </div>
              ))}
            </div>
          </div>

          {/* Data Section */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-[var(--foreground-2)] tracking-wide uppercase">
              Data
            </h4>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Get Data", icon: "🗄️" },
                { label: "Transform", icon: "📊" },
                { label: "Store Value", icon: "💾" },
              ].map((item) => (
                <div
                  key={item.label}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/reactflow", item.label);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex items-center justify-between cursor-grab bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-3)] active:cursor-grabbing shadow-sm transition-all group duration-150"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <GripVertical className="size-3.5 text-[var(--foreground-3)]/60 group-hover:text-[var(--foreground-3)]" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center / Full Canvas Workspace */}
        <main
          className="flex-1 h-full w-full relative react-flow-canvas-container"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="h-full w-full"
          >
            <Background color="var(--grid-color)" gap={24} className="opacity-[0.08]" />

            {/* Custom styled controls in floating toolbar instead, but let's hide default ones */}
            <Controls className="!bg-[var(--surface-2)] !border-[var(--glass-border)] !shadow-lg !rounded-lg" />
            <MiniMap
              className="!bg-[var(--surface-2)]/90 !border-[var(--glass-border)] !shadow-lg !rounded-lg"
              nodeStrokeColor="var(--glass-border)"
              maskColor="rgba(0,0,0,0.15)"
            />

            {/* Centered Floating Toolbar */}
            <Panel position="bottom-center" className="mb-4">
              <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[var(--glass-border)] bg-[var(--surface-2)]/90 backdrop-blur-xl shadow-float z-50 text-xs">
                {/* Undo / Redo */}
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-1.5 text-[var(--foreground-2)] hover:text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--surface-3)] rounded-md transition-colors"
                  title="Undo"
                >
                  <Undo2 className="size-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-1.5 text-[var(--foreground-2)] hover:text-foreground disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--surface-3)] rounded-md transition-colors"
                  title="Redo"
                >
                  <Redo2 className="size-4" />
                </button>

                <div className="w-px h-4 bg-[var(--glass-border)] mx-1" />

                {/* Zoom Info and Controls */}
                <button
                  onClick={() => zoomOut()}
                  className="p-1.5 text-[var(--foreground-2)] hover:text-foreground hover:bg-[var(--surface-3)] rounded-md transition-colors"
                >
                  <ZoomOut className="size-4" />
                </button>

                <span className="font-mono font-bold text-[11px] text-[var(--foreground-2)] min-w-[36px] text-center">
                  {zoom ? Math.round(zoom * 100) : "85"}%
                </span>

                <button
                  onClick={() => zoomIn()}
                  className="p-1.5 text-[var(--foreground-2)] hover:text-foreground hover:bg-[var(--surface-3)] rounded-md transition-colors"
                >
                  <ZoomIn className="size-4" />
                </button>

                <button
                  onClick={() => fitView({ duration: 400 })}
                  className="p-1.5 text-[var(--foreground-2)] hover:text-foreground hover:bg-[var(--surface-3)] rounded-md transition-colors"
                  title="Fit to Screen"
                >
                  <Maximize className="size-4" />
                </button>

                <div className="w-px h-4 bg-[var(--glass-border)] mx-1" />

                {/* Delete Selected */}
                <button
                  onClick={deleteSelected}
                  disabled={!nodes.some((n) => n.selected)}
                  className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-1 font-semibold"
                  title="Delete Selected"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </main>

        {/* Right Side: Parameter Detail Config Panel */}
        <aside
          className={`w-[320px] border-l border-[var(--glass-border)] bg-[var(--surface-2)]/95 backdrop-blur-xl p-4 flex flex-col gap-4 z-10 overflow-y-auto shrink-0 shadow-lg transition-transform duration-200 ${
            selectedNode ? "translate-x-0" : "translate-x-full absolute right-0 h-full w-[320px]"
          }`}
        >
          {selectedNode ? (
            (() => {
              const nodeData = selectedNode.data as {
                label?: string;
                body?: string;
                model?: string;
                systemPrompt?: string;
                userPrompt?: string;
                outputVar?: string;
                temperature?: number;
              };
              return (
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                    <div className="flex items-center gap-2">
                      <Settings className="size-4 text-[hsl(var(--primary))]" />
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                        Node Configuration
                      </span>
                    </div>
                    <button
                      onClick={() => setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))}
                      className="p-1 hover:bg-[var(--surface-3)] rounded-md transition-colors text-[var(--foreground-3)] hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Node Basic Info */}
                  <div className="flex items-center gap-2 bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg p-2.5 shadow-sm">
                    <div className="size-7 rounded bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] flex items-center justify-center font-bold text-sm">
                      {selectedNode.type === "triggerNode"
                        ? "⏰"
                        : selectedNode.type === "conditionNode"
                          ? "⚖️"
                          : selectedNode.type === "aiPromptNode"
                            ? "🤖"
                            : "⚙️"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{nodeData.label}</span>
                      <span className="text-[10px] text-[var(--foreground-3)] font-medium font-mono">
                        {selectedNode.id}
                      </span>
                    </div>
                  </div>

                  {/* Node Detail Configurations based on Node Type */}
                  {selectedNode.type === "aiPromptNode" ? (
                    <div className="flex flex-col gap-4">
                      {/* Model */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--foreground-2)] uppercase tracking-wide">
                          Model
                        </label>
                        <div className="relative">
                          <select
                            value={nodeData.model || "GPT-4o"}
                            onChange={(e) => updateNodeData("model", e.target.value)}
                            className="w-full bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] appearance-none shadow-sm cursor-pointer"
                          >
                            <option value="GPT-4o">GPT-4o</option>
                            <option value="GPT-4-turbo">GPT-4 Turbo</option>
                            <option value="Claude-3.5-Sonnet">Claude 3.5 Sonnet</option>
                            <option value="Gemini-1.5-Pro">Gemini 1.5 Pro</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[var(--foreground-3)] pointer-events-none" />
                        </div>
                      </div>

                      {/* System Prompt */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--foreground-2)] uppercase tracking-wide">
                          System Prompt
                        </label>
                        <textarea
                          rows={4}
                          value={nodeData.systemPrompt || ""}
                          onChange={(e) => updateNodeData("systemPrompt", e.target.value)}
                          className="w-full bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg p-2.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] shadow-sm leading-normal resize-none font-sans"
                          placeholder="e.g., You are a helpful assistant..."
                        />
                      </div>

                      {/* User Prompt with Variable chips */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-[var(--foreground-2)] uppercase tracking-wide">
                            User Prompt
                          </label>
                          <span className="text-[9px] font-bold text-[hsl(var(--primary))] uppercase">
                            Supports Variables
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <textarea
                            rows={4}
                            value={nodeData.userPrompt || nodeData.body || ""}
                            onChange={(e) => updateNodeData("userPrompt", e.target.value)}
                            className="w-full bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg p-2.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] shadow-sm leading-normal resize-none"
                          />

                          {/* Interactive Drag Variable Chips */}
                          <div className="flex flex-wrap gap-1 border border-dashed border-[var(--glass-border)] rounded-lg p-2 bg-[var(--surface-1)]/50">
                            <span className="text-[9px] font-bold text-[var(--foreground-3)] w-full mb-0.5">
                              Drag-in Variables:
                            </span>
                            {["{{overdue_tasks}}", "{{team_lead}}", "{{current_time}}"].map(
                              (chip) => (
                                <button
                                  key={chip}
                                  onClick={() => {
                                    const currentVal = nodeData.userPrompt || nodeData.body || "";
                                    updateNodeData("userPrompt", currentVal + " " + chip);
                                  }}
                                  className="bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded hover:bg-[hsl(var(--primary))]/20 transition-colors"
                                >
                                  {chip}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Output Variable */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--foreground-2)] uppercase tracking-wide">
                          Output Variable
                        </label>
                        <input
                          type="text"
                          value={nodeData.outputVar || ""}
                          onChange={(e) => updateNodeData("outputVar", e.target.value)}
                          className="w-full bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs text-foreground font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] shadow-sm"
                          placeholder="{{ai_result}}"
                        />
                      </div>

                      {/* Temperature Slider */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-[var(--foreground-2)] uppercase tracking-wide flex items-center gap-1">
                            <Sliders className="size-3" />
                            Temperature
                          </label>
                          <span className="text-[10px] font-bold font-mono text-[hsl(var(--primary))]">
                            {(nodeData.temperature !== undefined
                              ? nodeData.temperature
                              : 0.7
                            ).toFixed(1)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.1"
                          value={nodeData.temperature !== undefined ? nodeData.temperature : 0.7}
                          onChange={(e) =>
                            updateNodeData("temperature", parseFloat(e.target.value))
                          }
                          className="w-full accent-[hsl(var(--primary))] bg-[var(--surface-3)] h-1 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="border-t border-[var(--glass-border)] pt-4 mt-2">
                        <Button
                          variant="outline"
                          className="w-full text-xs font-semibold gap-1.5 shadow-sm py-2"
                        >
                          <Play className="size-3 fill-current text-[var(--foreground-2)]" />
                          Test this node
                        </Button>
                      </div>
                    </div>
                  ) : selectedNode.type === "triggerNode" ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--foreground-2)] uppercase tracking-wide">
                          Trigger Type
                        </label>
                        <input
                          type="text"
                          disabled
                          value={nodeData.label || ""}
                          className="w-full bg-[var(--surface-3)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground-2)] font-semibold"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--foreground-2)] uppercase tracking-wide">
                          Cron / Condition
                        </label>
                        <input
                          type="text"
                          value={nodeData.body || ""}
                          onChange={(e) => updateNodeData("body", e.target.value)}
                          className="w-full bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] shadow-sm"
                        />
                      </div>
                    </div>
                  ) : selectedNode.type === "conditionNode" ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--foreground-2)] uppercase tracking-wide">
                          Condition Query
                        </label>
                        <input
                          type="text"
                          value={nodeData.body || ""}
                          onChange={(e) => updateNodeData("body", e.target.value)}
                          className="w-full bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-xs text-foreground font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] shadow-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--foreground-2)] uppercase tracking-wide">
                          Action Template Body
                        </label>
                        <textarea
                          rows={3}
                          value={nodeData.body || ""}
                          onChange={(e) => updateNodeData("body", e.target.value)}
                          className="w-full bg-[var(--surface-1)] border border-[var(--glass-border)] rounded-lg p-2.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] shadow-sm leading-normal resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Settings className="size-8 text-[var(--foreground-3)] opacity-40 mb-2.5 animate-pulse" />
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--foreground-2)]">
                Config
              </span>
              <p className="text-[10px] text-[var(--foreground-3)]/90 mt-1 leading-normal max-w-[180px]">
                Select a node on the canvas to configure its advanced parameters.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export function AgentBuilderCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
