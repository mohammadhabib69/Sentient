// Sentient Phase 0 Neo4j schema.
// Apply with:
// cypher-shell -u neo4j -p sentient-neo4j-password -f packages/graph/cypher/001_schema.cypher

CREATE CONSTRAINT organization_id_unique IF NOT EXISTS
FOR (node:Organization)
REQUIRE node.id IS UNIQUE;

CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (node:User)
REQUIRE node.id IS UNIQUE;

CREATE CONSTRAINT workspace_id_unique IF NOT EXISTS
FOR (node:Workspace)
REQUIRE node.id IS UNIQUE;

CREATE CONSTRAINT project_id_unique IF NOT EXISTS
FOR (node:Project)
REQUIRE node.id IS UNIQUE;

CREATE CONSTRAINT task_id_unique IF NOT EXISTS
FOR (node:Task)
REQUIRE node.id IS UNIQUE;

CREATE CONSTRAINT agent_id_unique IF NOT EXISTS
FOR (node:Agent)
REQUIRE node.id IS UNIQUE;

CREATE INDEX organization_plan_idx IF NOT EXISTS
FOR (node:Organization)
ON (node.plan);

CREATE INDEX user_org_role_idx IF NOT EXISTS
FOR (node:User)
ON (node.orgId, node.role);

CREATE INDEX workspace_org_idx IF NOT EXISTS
FOR (node:Workspace)
ON (node.orgId);

CREATE INDEX project_workspace_status_idx IF NOT EXISTS
FOR (node:Project)
ON (node.workspaceId, node.status);

CREATE INDEX project_org_priority_idx IF NOT EXISTS
FOR (node:Project)
ON (node.orgId, node.priority);

CREATE INDEX task_project_status_idx IF NOT EXISTS
FOR (node:Task)
ON (node.projectId, node.status);

CREATE INDEX task_org_priority_idx IF NOT EXISTS
FOR (node:Task)
ON (node.orgId, node.priority);

CREATE INDEX agent_org_type_idx IF NOT EXISTS
FOR (node:Agent)
ON (node.orgId, node.type);
