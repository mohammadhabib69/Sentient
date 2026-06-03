/**
 * Flow compiler (Phase 9 §6).
 *
 * Converts a visual flow definition (React Flow nodes + edges) into
 * executable JavaScript code that can run in the sandbox.
 *
 * The compilation pipeline:
 *   1. Find trigger node — flows must have exactly one
 *   2. Validate connections — no cycles, all inputs connected
 *   3. Topological sort — determine execution order (DAG)
 *   4. Generate code — emit async JS that calls actions in order
 */

export interface CompiledAgent {
  code: string;
  requiredTools: string[];
  triggers: string[];
  errors: ValidationError[];
}

export interface ValidationError {
  nodeId: string;
  message: string;
  severity: "error" | "warning";
}

/** Minimal node shape used during compilation. */
interface FlowNode {
  id: string;
  type: string | undefined;
  data: Record<string, unknown>;
}

/** Minimal edge shape used during compilation. */
interface FlowEdge {
  source: string;
  target: string;
  sourceHandle?: string | null;
}

export function compileFlow(
  nodes: FlowNode[],
  edges: FlowEdge[],
): CompiledAgent {
  const errors: ValidationError[] = [];

  // --- 1. Find trigger node ---
  const triggerNode = nodes.find((n) => n.type?.startsWith("trigger"));
  if (!triggerNode) {
    errors.push({
      nodeId: "",
      message: "Flow must have a trigger node",
      severity: "error",
    });
  }

  // --- 2. Find action nodes ---
  const actionNodes = nodes.filter((n) => n.type?.startsWith("action"));
  if (actionNodes.length === 0) {
    errors.push({
      nodeId: "",
      message: "Flow must have at least one action node",
      severity: "error",
    });
  }

  // --- 3. Validate connections ---
  validateConnections(nodes, edges, errors);

  // Bail early if there are hard errors
  if (errors.filter((e) => e.severity === "error").length > 0) {
    return { code: "", requiredTools: [], triggers: [], errors };
  }

  // --- 4. Generate executable code ---
  const code = generateAgentCode(nodes, edges);

  return {
    code,
    requiredTools: actionNodes
      .map((n) => (n.data as any).actionType ?? "")
      .filter(Boolean),
    triggers: triggerNode ? [((triggerNode.data as any).triggerType ?? triggerNode.type?.split(":")[1])] : [],
    errors,
  };
}

// ─── Validation ────────────────────────────────────────────────────

function validateConnections(
  nodes: FlowNode[],
  edges: FlowEdge[],
  errors: ValidationError[],
) {
  // Check for cycles
  const hasCycle = detectCycle(nodes, edges);
  if (hasCycle) {
    errors.push({
      nodeId: "",
      message: "Flow contains a cycle — flows must be acyclic (DAG)",
      severity: "error",
    });
  }

  // Check that all non-trigger nodes have at least one incoming edge
  const nonTriggerNodes = nodes.filter(
    (n) => !n.type?.startsWith("trigger"),
  );
  for (const node of nonTriggerNodes) {
    const incomingEdges = edges.filter((e) => e.target === node.id);
    if (incomingEdges.length === 0) {
      errors.push({
        nodeId: node.id,
        message: `${node.type} node must have an incoming connection`,
        severity: "error",
      });
    }
  }
}

// ─── Cycle Detection (DFS) ────────────────────────────────────────

function detectCycle(nodes: FlowNode[], edges: FlowEdge[]): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycleDFS(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const outgoing = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoing) {
      const targetId = edge.target;
      if (!visited.has(targetId)) {
        if (hasCycleDFS(targetId)) return true;
      } else if (recStack.has(targetId)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycleDFS(node.id)) return true;
    }
  }

  return false;
}

// ─── Topological Sort ──────────────────────────────────────────────

function topologicalSort(
  nodes: FlowNode[],
  edges: FlowEdge[],
): FlowNode[] {
  const sorted: FlowNode[] = [];
  const visited = new Set<string>();

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const outgoing = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoing) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode) visit(targetNode.id);
    }

    const node = nodes.find((n) => n.id === nodeId);
    if (node) sorted.push(node);
  }

  for (const node of nodes) {
    visit(node.id);
  }

  return sorted.reverse();
}

// ─── Code Generation ───────────────────────────────────────────────

function generateAgentCode(nodes: FlowNode[], edges: FlowEdge[]): string {
  const sorted = topologicalSort(nodes, edges);

  let code = `
// Auto-generated custom agent code
export async function executeCustomAgent(input, org) {
  const results = {};
  let currentData = input;

`;

  for (const node of sorted) {
    const nodeData = node.data as Record<string, unknown>;
    const nodeType = (node.type ?? "") as string;

    if (nodeType.startsWith("trigger")) {
      code += `  // Trigger: ${String(nodeData.label ?? "trigger")}\n`;
      code += `  currentData = input;\n\n`;
    } else if (nodeType.startsWith("action")) {
      const actionType = String(nodeData.actionType ?? node.type?.split(":")[1] ?? "");
      const config = JSON.stringify(nodeData.config ?? {});
      code += `  // Action: ${String(nodeData.label ?? "action")}\n`;
      code += `  results['${node.id}'] = await executeAction(\n`;
      code += `    '${actionType}',\n`;
      code += `    ${config},\n`;
      code += `    { ...results, input: currentData, org }\n`;
      code += `  );\n`;
      code += `  currentData = results['${node.id}'];\n\n`;
    } else if (nodeType.startsWith("condition")) {
      const expression = String(nodeData.expression ?? "");
      code += `  // Condition: ${String(nodeData.label ?? "condition")}\n`;
      code += `  const condition_${node.id.replace(/-/g, "_")} = evaluateCondition(\n`;
      code += `    '${expression.replace(/'/g, "\\'")}',\n`;
      code += `    { ...results, input: currentData, org }\n`;
      code += `  );\n`;
      code += `  if (!condition_${node.id.replace(/-/g, "_")}) {\n`;
      code += `    currentData = false;\n`;
      code += `  }\n\n`;
    }
  }

  code += `  return { proposedActions: Object.values(results).flat() };
}
`;

  return code;
}
