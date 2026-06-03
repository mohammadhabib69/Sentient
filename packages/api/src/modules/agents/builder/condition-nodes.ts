/**
 * Condition node definitions (Phase 9 §4.4).
 *
 * Each condition type defines its label, description, config fields,
 * and output schema — used by the canvas config panel and the compiler.
 */
import { BaseNodeDef } from "./node-types.js";

export const CONDITION_NODE_DEFS: Record<string, BaseNodeDef> = {
  expression: {
    label: "If Expression",
    description: "Branch based on JavaScript expression",
    category: "condition",
    icon: "❓",
    configFields: [
      {
        name: "expression",
        label: "Condition (JavaScript)",
        type: "code",
        language: "javascript",
        example: "inputData.priority === 'critical' && !inputData.resolved",
        help: "Return true or false. Available vars: input, previousResults",
        required: true,
      },
      {
        name: "truthyLabel",
        label: "True Branch Label",
        type: "text",
        default: "True",
      },
      {
        name: "falsyLabel",
        label: "False Branch Label",
        type: "text",
        default: "False",
      },
    ],
    outputs: [
      {
        name: "result",
        type: "boolean",
        description: "Expression result",
      },
    ],
  },

  dataTypeCheck: {
    label: "Type Check",
    description: "Check if data matches a type",
    category: "condition",
    icon: "🔍",
    configFields: [
      {
        name: "inputValue",
        label: "Input Value",
        type: "input-reference",
        required: true,
      },
      {
        name: "checkType",
        label: "Check Type",
        type: "select",
        options: [
          "isUUID",
          "isEmail",
          "isNumber",
          "isString",
          "isArray",
          "isObject",
        ],
        required: true,
      },
    ],
    outputs: [
      {
        name: "result",
        type: "boolean",
        description: "Check result",
      },
    ],
  },

  valueComparison: {
    label: "Compare Values",
    description: "Compare two values",
    category: "condition",
    icon: "⚖️",
    configFields: [
      {
        name: "leftValue",
        label: "Left Value",
        type: "input-reference",
        required: true,
      },
      {
        name: "operator",
        label: "Operator",
        type: "select",
        options: ["===", "!==", ">", "<", ">=", "<=", "includes", "excludes"],
        required: true,
      },
      {
        name: "rightValue",
        label: "Right Value",
        type: "input-reference",
        required: true,
      },
    ],
    outputs: [
      {
        name: "result",
        type: "boolean",
        description: "Comparison result",
      },
    ],
  },
} as const;
