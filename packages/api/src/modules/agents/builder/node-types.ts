/**
 * Node type definitions for the no-code agent builder (Phase 9 §4).
 *
 * Shared TypeScript types that describe the data shape of each node
 * category on the canvas. These are used by the compiler, the sandbox,
 * and the frontend config panel.
 */

export type NodeType = "trigger" | "action" | "condition" | "output";

/** Generic config field used by the node definitions. */
export interface ConfigField {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "code"
    | "password"
    | "input-reference"
    | "user-select"
    | "date-picker";
  options?: string[];
  required?: boolean;
  default?: unknown;
  placeholder?: string;
  example?: string;
  help?: string;
  language?: string;
}

export interface NodeOutput {
  name: string;
  type: string;
  description: string;
}

export interface BaseNodeDef {
  label: string;
  description: string;
  category: NodeType;
  icon: string;
  configFields: ConfigField[];
  outputs: NodeOutput[];
}

export interface BaseNodeData {
  label: string;
  config: Record<string, unknown>;
  description?: string;
}

export interface TriggerNodeData extends BaseNodeData {
  triggerType: string; // 'event', 'schedule', 'webhook', 'manual'
  filterExpression?: string;
}

export interface ActionNodeData extends BaseNodeData {
  actionType: string;
  parameterMappings: Record<string, unknown>;
}

export interface ConditionNodeData extends BaseNodeData {
  expression: string;
  truthyLabel: string;
  falsyLabel: string;
}

export interface OutputNodeData extends BaseNodeData {
  actions: string[];
}
