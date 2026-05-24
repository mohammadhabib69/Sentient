export const GRAPH_NODE_LABELS = [
  "Organization",
  "User",
  "Workspace",
  "Project",
  "Task",
  "Agent",
] as const;

export const GRAPH_RELATIONSHIPS = [
  "MEMBER_OF",
  "BELONGS_TO",
  "LIVES_IN",
  "PART_OF",
  "ASSIGNED_TO",
  "DEPENDS_ON",
  "MONITORS",
  "ACTED_ON",
] as const;

export type GraphNodeLabel = (typeof GRAPH_NODE_LABELS)[number];
export type GraphRelationship = (typeof GRAPH_RELATIONSHIPS)[number];
