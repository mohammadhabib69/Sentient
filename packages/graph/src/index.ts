import neo4j, { type Driver } from "neo4j-driver";

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

export interface GraphDriverConfig {
  uri: string;
  user: string;
  password: string;
}

export interface GraphSyncOptions {
  database?: string;
}

export interface GraphOrganization {
  id: string;
  name: string;
  plan: string;
  slug?: string;
  updatedAt?: string;
}

export interface GraphUser {
  id: string;
  orgId: string;
  name: string;
  role: string;
  updatedAt?: string;
}

export interface GraphWorkspace {
  id: string;
  orgId: string;
  name: string;
  updatedAt?: string;
}

export interface GraphProject {
  id: string;
  workspaceId: string;
  orgId: string;
  name: string;
  status: string;
  priority: string;
  updatedAt?: string;
}

export interface GraphTask {
  id: string;
  projectId: string;
  orgId: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  updatedAt?: string;
}

export interface GraphAgent {
  id: string;
  orgId: string;
  name: string;
  type: string;
  updatedAt?: string;
}

export interface GraphAgentAction {
  id: string;
  agentId: string;
  payload: Record<string, unknown>;
}

export interface GraphAgentProjectMonitor {
  agentId: string;
  projectId: string;
}

export interface GraphOrganizationSnapshot {
  organization: GraphOrganization;
  users: GraphUser[];
  workspaces: GraphWorkspace[];
  projects: GraphProject[];
  tasks: GraphTask[];
  agents: GraphAgent[];
  agentActions?: GraphAgentAction[];
  agentProjectMonitors?: GraphAgentProjectMonitor[];
}

export function createGraphDriver(config: GraphDriverConfig): Driver {
  return neo4j.driver(config.uri, neo4j.auth.basic(config.user, config.password));
}

export function deriveAgentProjectMonitors(
  agents: GraphAgent[],
  projects: GraphProject[],
): GraphAgentProjectMonitor[] {
  const monitors: GraphAgentProjectMonitor[] = [];

  for (const agent of agents) {
    const agentType = agent.type.toLowerCase();

    for (const project of projects) {
      const projectName = project.name.toLowerCase();

      if (
        (agentType === "operations" &&
          (projectName.includes("launch") || projectName.includes("escalation"))) ||
        (agentType === "finance" && projectName.includes("finance")) ||
        (agentType === "customer" &&
          (projectName.includes("customer") || projectName.includes("escalation"))) ||
        (agentType === "dev" &&
          (projectName.includes("platform") ||
            projectName.includes("core") ||
            projectName.includes("sentient")))
      ) {
        monitors.push({ agentId: agent.id, projectId: project.id });
      }
    }
  }

  return monitors;
}

export function deriveAgentTaskActions(agentActions: GraphAgentAction[]) {
  return agentActions.flatMap((action) => {
    const taskId = action.payload.taskId;

    if (typeof taskId !== "string") {
      return [];
    }

    return [{ agentId: action.agentId, taskId }];
  });
}

export class GraphSyncService {
  constructor(
    private readonly driver: Driver,
    private readonly options: GraphSyncOptions = {},
  ) {}

  async close(): Promise<void> {
    await this.driver.close();
  }

  async syncOrganizationGraph(snapshot: GraphOrganizationSnapshot): Promise<void> {
    await this.syncOrganization(snapshot.organization);
    await this.syncUsers(snapshot.organization.id, snapshot.users);
    await this.syncWorkspaces(snapshot.organization.id, snapshot.workspaces);
    await this.syncProjects(snapshot.projects);
    await this.syncTasks(snapshot.tasks);
    await this.syncAgents(snapshot.organization.id, snapshot.agents);
    await this.syncAgentProjectMonitors(
      snapshot.agentProjectMonitors ??
        deriveAgentProjectMonitors(snapshot.agents, snapshot.projects),
    );
    await this.syncAgentActions(snapshot.agentActions ?? []);
  }

  async syncOrganization(organization: GraphOrganization): Promise<void> {
    await this.write(
      `
      MERGE (org:Organization {id: $organization.id})
      SET org.name = $organization.name,
          org.plan = $organization.plan,
          org.slug = $organization.slug,
          org.updatedAt = $organization.updatedAt
      `,
      { organization: withUpdatedAt(organization) },
    );
  }

  async syncUsers(orgId: string, users: GraphUser[]): Promise<void> {
    await this.write(
      `
      MATCH (org:Organization {id: $orgId})
      UNWIND $users AS row
      MERGE (user:User {id: row.id})
      SET user.orgId = row.orgId,
          user.name = row.name,
          user.role = row.role,
          user.updatedAt = row.updatedAt
      WITH user, org
      OPTIONAL MATCH (user)-[old:MEMBER_OF]->(:Organization)
      DELETE old
      MERGE (user)-[:MEMBER_OF]->(org)
      `,
      { orgId, users: users.map(withUpdatedAt) },
    );
  }

  async syncWorkspaces(orgId: string, workspaces: GraphWorkspace[]): Promise<void> {
    await this.write(
      `
      MATCH (org:Organization {id: $orgId})
      UNWIND $workspaces AS row
      MERGE (workspace:Workspace {id: row.id})
      SET workspace.orgId = row.orgId,
          workspace.name = row.name,
          workspace.updatedAt = row.updatedAt
      WITH workspace, org
      OPTIONAL MATCH (workspace)-[old:BELONGS_TO]->(:Organization)
      DELETE old
      MERGE (workspace)-[:BELONGS_TO]->(org)
      `,
      { orgId, workspaces: workspaces.map(withUpdatedAt) },
    );
  }

  async syncProjects(projects: GraphProject[]): Promise<void> {
    await this.write(
      `
      UNWIND $projects AS row
      MATCH (workspace:Workspace {id: row.workspaceId})
      MERGE (project:Project {id: row.id})
      SET project.workspaceId = row.workspaceId,
          project.orgId = row.orgId,
          project.name = row.name,
          project.status = row.status,
          project.priority = row.priority,
          project.updatedAt = row.updatedAt
      WITH project, workspace
      OPTIONAL MATCH (project)-[old:LIVES_IN]->(:Workspace)
      DELETE old
      MERGE (project)-[:LIVES_IN]->(workspace)
      `,
      { projects: projects.map(withUpdatedAt) },
    );
  }

  async syncTasks(tasks: GraphTask[]): Promise<void> {
    const assignedTasks = tasks.filter((task) => task.assigneeId);
    const dependentTasks = tasks.filter((task) => task.parentTaskId);

    await this.write(
      `
      UNWIND $tasks AS row
      MATCH (project:Project {id: row.projectId})
      MERGE (task:Task {id: row.id})
      SET task.projectId = row.projectId,
          task.orgId = row.orgId,
          task.title = row.title,
          task.status = row.status,
          task.priority = row.priority,
          task.assigneeId = row.assigneeId,
          task.parentTaskId = row.parentTaskId,
          task.updatedAt = row.updatedAt
      WITH task, project
      OPTIONAL MATCH (task)-[old:PART_OF]->(:Project)
      DELETE old
      MERGE (task)-[:PART_OF]->(project)
      `,
      { tasks: tasks.map(withUpdatedAt) },
    );

    await this.write(
      `
      UNWIND $tasks AS row
      MATCH (task:Task {id: row.id})
      OPTIONAL MATCH (:User)-[old:ASSIGNED_TO]->(task)
      DELETE old
      `,
      { tasks },
    );

    await this.write(
      `
      UNWIND $tasks AS row
      MATCH (task:Task {id: row.id})
      WITH task, row
      MATCH (user:User {id: row.assigneeId})
      MERGE (user)-[:ASSIGNED_TO]->(task)
      `,
      { tasks: assignedTasks },
    );

    await this.write(
      `
      UNWIND $tasks AS row
      MATCH (task:Task {id: row.id})
      OPTIONAL MATCH (task)-[old:DEPENDS_ON]->(:Task)
      DELETE old
      `,
      { tasks },
    );

    await this.write(
      `
      UNWIND $tasks AS row
      MATCH (task:Task {id: row.id})
      WITH task, row
      MATCH (dependency:Task {id: row.parentTaskId})
      MERGE (task)-[:DEPENDS_ON]->(dependency)
      `,
      { tasks: dependentTasks },
    );
  }

  async syncAgents(orgId: string, agents: GraphAgent[]): Promise<void> {
    await this.write(
      `
      MATCH (org:Organization {id: $orgId})
      WITH org
      UNWIND $agents AS row
      MERGE (agent:Agent {id: row.id})
      SET agent.orgId = org.id,
          agent.name = row.name,
          agent.type = row.type,
          agent.updatedAt = row.updatedAt
      `,
      { orgId, agents: agents.map(withUpdatedAt) },
    );
  }

  async syncAgentProjectMonitors(monitors: GraphAgentProjectMonitor[]): Promise<void> {
    await this.write(
      `
      UNWIND $monitors AS row
      MATCH (agent:Agent {id: row.agentId})
      MATCH (project:Project {id: row.projectId})
      MERGE (agent)-[:MONITORS]->(project)
      `,
      { monitors },
    );
  }

  async syncAgentActions(agentActions: GraphAgentAction[]): Promise<void> {
    await this.write(
      `
      UNWIND $actions AS row
      MATCH (agent:Agent {id: row.agentId})
      MATCH (task:Task {id: row.taskId})
      MERGE (agent)-[:ACTED_ON]->(task)
      `,
      { actions: deriveAgentTaskActions(agentActions) },
    );
  }

  private async write(query: string, parameters: Record<string, unknown>): Promise<void> {
    const session = this.driver.session({
      defaultAccessMode: neo4j.session.WRITE,
      database: this.options.database,
    });

    try {
      await session.executeWrite(async (tx) => {
        await tx.run(query, parameters);
      });
    } finally {
      await session.close();
    }
  }
}

function withUpdatedAt<T extends { updatedAt?: string }>(value: T): T & { updatedAt: string } {
  return {
    ...value,
    updatedAt: value.updatedAt ?? new Date().toISOString(),
  };
}
