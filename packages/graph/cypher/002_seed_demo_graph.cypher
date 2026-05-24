// Sentient Phase 0 demo graph.
// Apply after PostgreSQL seed data when Neo4j is running:
// cypher-shell -u neo4j -p sentient-neo4j-password -f packages/graph/cypher/002_seed_demo_graph.cypher

MERGE (org:Organization {id: '00000000-0000-4000-8000-000000000001'})
SET
  org.name = 'Acme Operations Lab',
  org.plan = 'business',
  org.slug = 'acme-operations-lab',
  org.updatedAt = datetime();

UNWIND [
  {id: '00000000-0000-4000-8000-000000000101', name: 'Mohammad Habib', role: 'org_admin'},
  {id: '00000000-0000-4000-8000-000000000102', name: 'Aisha Rahman', role: 'manager'},
  {id: '00000000-0000-4000-8000-000000000103', name: 'Daniel Kim', role: 'member'},
  {id: '00000000-0000-4000-8000-000000000104', name: 'Priya Shah', role: 'member'},
  {id: '00000000-0000-4000-8000-000000000105', name: 'Omar Faruque', role: 'guest'}
] AS row
MERGE (user:User {id: row.id})
SET
  user.name = row.name,
  user.role = row.role,
  user.orgId = '00000000-0000-4000-8000-000000000001',
  user.updatedAt = datetime()
WITH user
MATCH (org:Organization {id: '00000000-0000-4000-8000-000000000001'})
MERGE (user)-[:MEMBER_OF]->(org);

UNWIND [
  {id: '00000000-0000-4000-8000-000000000201', name: 'Operations Command'},
  {id: '00000000-0000-4000-8000-000000000202', name: 'Product Delivery'}
] AS row
MERGE (workspace:Workspace {id: row.id})
SET
  workspace.name = row.name,
  workspace.orgId = '00000000-0000-4000-8000-000000000001',
  workspace.updatedAt = datetime()
WITH workspace
MATCH (org:Organization {id: '00000000-0000-4000-8000-000000000001'})
MERGE (workspace)-[:BELONGS_TO]->(org);

UNWIND [
  {id: '00000000-0000-4000-8000-000000000301', workspaceId: '00000000-0000-4000-8000-000000000201', name: 'Q3 Launch Readiness', status: 'active', priority: 'high'},
  {id: '00000000-0000-4000-8000-000000000302', workspaceId: '00000000-0000-4000-8000-000000000201', name: 'Customer Escalation Workflow', status: 'active', priority: 'critical'},
  {id: '00000000-0000-4000-8000-000000000303', workspaceId: '00000000-0000-4000-8000-000000000202', name: 'Sentient Core Platform', status: 'active', priority: 'high'},
  {id: '00000000-0000-4000-8000-000000000304', workspaceId: '00000000-0000-4000-8000-000000000201', name: 'Finance Automation Pilot', status: 'paused', priority: 'medium'}
] AS row
MERGE (project:Project {id: row.id})
SET
  project.workspaceId = row.workspaceId,
  project.orgId = '00000000-0000-4000-8000-000000000001',
  project.name = row.name,
  project.status = row.status,
  project.priority = row.priority,
  project.updatedAt = datetime()
WITH project, row
MATCH (workspace:Workspace {id: row.workspaceId})
MERGE (project)-[:LIVES_IN]->(workspace);

UNWIND [
  {id: '00000000-0000-4000-8000-000000000401', projectId: '00000000-0000-4000-8000-000000000301', title: 'Finalize cross-functional launch plan', status: 'in_progress', priority: 'high', assigneeId: '00000000-0000-4000-8000-000000000102'},
  {id: '00000000-0000-4000-8000-000000000402', projectId: '00000000-0000-4000-8000-000000000301', title: 'Confirm vendor readiness checklist', status: 'todo', priority: 'medium', assigneeId: '00000000-0000-4000-8000-000000000105'},
  {id: '00000000-0000-4000-8000-000000000403', projectId: '00000000-0000-4000-8000-000000000301', title: 'Prepare executive launch briefing', status: 'review', priority: 'high', assigneeId: '00000000-0000-4000-8000-000000000101'},
  {id: '00000000-0000-4000-8000-000000000404', projectId: '00000000-0000-4000-8000-000000000301', title: 'Review launch risk register', status: 'blocked', priority: 'critical', assigneeId: '00000000-0000-4000-8000-000000000102'},
  {id: '00000000-0000-4000-8000-000000000405', projectId: '00000000-0000-4000-8000-000000000302', title: 'Draft priority support macros', status: 'done', priority: 'medium', assigneeId: '00000000-0000-4000-8000-000000000105'},
  {id: '00000000-0000-4000-8000-000000000406', projectId: '00000000-0000-4000-8000-000000000302', title: 'Define enterprise escalation SLA matrix', status: 'in_progress', priority: 'critical', assigneeId: '00000000-0000-4000-8000-000000000102'},
  {id: '00000000-0000-4000-8000-000000000407', projectId: '00000000-0000-4000-8000-000000000302', title: 'Create weekly customer risk digest', status: 'todo', priority: 'high', assigneeId: '00000000-0000-4000-8000-000000000105'},
  {id: '00000000-0000-4000-8000-000000000408', projectId: '00000000-0000-4000-8000-000000000303', title: 'Implement event ingestion API contract', status: 'in_progress', priority: 'high', assigneeId: '00000000-0000-4000-8000-000000000103'},
  {id: '00000000-0000-4000-8000-000000000409', projectId: '00000000-0000-4000-8000-000000000303', title: 'Build first CQRS event projection', status: 'todo', priority: 'high', assigneeId: '00000000-0000-4000-8000-000000000103'},
  {id: '00000000-0000-4000-8000-000000000410', projectId: '00000000-0000-4000-8000-000000000303', title: 'Design human approval workflow', status: 'review', priority: 'critical', assigneeId: '00000000-0000-4000-8000-000000000101'},
  {id: '00000000-0000-4000-8000-000000000411', projectId: '00000000-0000-4000-8000-000000000303', title: 'Prototype mobile approval screen', status: 'todo', priority: 'medium', assigneeId: '00000000-0000-4000-8000-000000000103'},
  {id: '00000000-0000-4000-8000-000000000412', projectId: '00000000-0000-4000-8000-000000000303', title: 'Define Neo4j graph constraints', status: 'todo', priority: 'medium', assigneeId: '00000000-0000-4000-8000-000000000103'},
  {id: '00000000-0000-4000-8000-000000000413', projectId: '00000000-0000-4000-8000-000000000304', title: 'Map invoice approval rules', status: 'review', priority: 'medium', assigneeId: '00000000-0000-4000-8000-000000000104'},
  {id: '00000000-0000-4000-8000-000000000414', projectId: '00000000-0000-4000-8000-000000000304', title: 'Sketch finance automation dashboard', status: 'todo', priority: 'low', assigneeId: '00000000-0000-4000-8000-000000000104'},
  {id: '00000000-0000-4000-8000-000000000415', projectId: '00000000-0000-4000-8000-000000000304', title: 'Write reconciliation exception runbook', status: 'blocked', priority: 'high', assigneeId: '00000000-0000-4000-8000-000000000104'}
] AS row
MERGE (task:Task {id: row.id})
SET
  task.projectId = row.projectId,
  task.orgId = '00000000-0000-4000-8000-000000000001',
  task.title = row.title,
  task.status = row.status,
  task.priority = row.priority,
  task.assigneeId = row.assigneeId,
  task.updatedAt = datetime()
WITH task, row
MATCH (project:Project {id: row.projectId})
MERGE (task)-[:PART_OF]->(project)
WITH task, row
MATCH (user:User {id: row.assigneeId})
MERGE (user)-[:ASSIGNED_TO]->(task);

UNWIND [
  {taskId: '00000000-0000-4000-8000-000000000411', dependsOnTaskId: '00000000-0000-4000-8000-000000000410'},
  {taskId: '00000000-0000-4000-8000-000000000412', dependsOnTaskId: '00000000-0000-4000-8000-000000000409'}
] AS row
MATCH (task:Task {id: row.taskId})
MATCH (dependency:Task {id: row.dependsOnTaskId})
MERGE (task)-[:DEPENDS_ON]->(dependency);

UNWIND [
  {id: '00000000-0000-4000-8000-000000000501', name: 'Aria', type: 'operations'},
  {id: '00000000-0000-4000-8000-000000000502', name: 'Nova', type: 'finance'},
  {id: '00000000-0000-4000-8000-000000000503', name: 'Echo', type: 'customer'},
  {id: '00000000-0000-4000-8000-000000000504', name: 'Flux', type: 'dev'}
] AS row
MERGE (agent:Agent {id: row.id})
SET
  agent.name = row.name,
  agent.type = row.type,
  agent.orgId = '00000000-0000-4000-8000-000000000001',
  agent.updatedAt = datetime();

UNWIND [
  {agentId: '00000000-0000-4000-8000-000000000501', projectId: '00000000-0000-4000-8000-000000000301'},
  {agentId: '00000000-0000-4000-8000-000000000501', projectId: '00000000-0000-4000-8000-000000000302'},
  {agentId: '00000000-0000-4000-8000-000000000502', projectId: '00000000-0000-4000-8000-000000000304'},
  {agentId: '00000000-0000-4000-8000-000000000503', projectId: '00000000-0000-4000-8000-000000000302'},
  {agentId: '00000000-0000-4000-8000-000000000504', projectId: '00000000-0000-4000-8000-000000000303'}
] AS row
MATCH (agent:Agent {id: row.agentId})
MATCH (project:Project {id: row.projectId})
MERGE (agent)-[:MONITORS]->(project);

UNWIND [
  {agentId: '00000000-0000-4000-8000-000000000501', taskId: '00000000-0000-4000-8000-000000000404'},
  {agentId: '00000000-0000-4000-8000-000000000502', taskId: '00000000-0000-4000-8000-000000000413'}
] AS row
MATCH (agent:Agent {id: row.agentId})
MATCH (task:Task {id: row.taskId})
MERGE (agent)-[:ACTED_ON]->(task);
