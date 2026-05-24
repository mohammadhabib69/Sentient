import {
  ActorType,
  AgentActionStatus,
  AgentType,
  ApprovalMode,
  Plan,
  Prisma,
  PrismaClient,
  Priority,
  ProjectStatus,
  TaskStatus,
  UserRole,
} from "../generated/client/index.js";

const prisma = new PrismaClient();

const DEMO_PASSWORD_HASH_PLACEHOLDER =
  "$2b$12$placeholder.demo.hash.replace.when.auth.is.implemented";

const ids = {
  system: "00000000-0000-4000-8000-000000000000",
  org: "00000000-0000-4000-8000-000000000001",
  users: {
    mohammad: "00000000-0000-4000-8000-000000000101",
    aisha: "00000000-0000-4000-8000-000000000102",
    daniel: "00000000-0000-4000-8000-000000000103",
    priya: "00000000-0000-4000-8000-000000000104",
    omar: "00000000-0000-4000-8000-000000000105",
  },
  workspaces: {
    operations: "00000000-0000-4000-8000-000000000201",
    product: "00000000-0000-4000-8000-000000000202",
  },
  projects: {
    launch: "00000000-0000-4000-8000-000000000301",
    escalation: "00000000-0000-4000-8000-000000000302",
    platform: "00000000-0000-4000-8000-000000000303",
    finance: "00000000-0000-4000-8000-000000000304",
  },
  tasks: {
    launchPlan: "00000000-0000-4000-8000-000000000401",
    vendorReadiness: "00000000-0000-4000-8000-000000000402",
    execBriefing: "00000000-0000-4000-8000-000000000403",
    riskReview: "00000000-0000-4000-8000-000000000404",
    supportMacros: "00000000-0000-4000-8000-000000000405",
    escalationSla: "00000000-0000-4000-8000-000000000406",
    customerDigest: "00000000-0000-4000-8000-000000000407",
    ingestionApi: "00000000-0000-4000-8000-000000000408",
    eventProjection: "00000000-0000-4000-8000-000000000409",
    approvalFlow: "00000000-0000-4000-8000-000000000410",
    mobileApproval: "00000000-0000-4000-8000-000000000411",
    graphConstraints: "00000000-0000-4000-8000-000000000412",
    invoiceRules: "00000000-0000-4000-8000-000000000413",
    financeDashboard: "00000000-0000-4000-8000-000000000414",
    reconciliationRunbook: "00000000-0000-4000-8000-000000000415",
  },
  agents: {
    aria: "00000000-0000-4000-8000-000000000501",
    nova: "00000000-0000-4000-8000-000000000502",
    echo: "00000000-0000-4000-8000-000000000503",
    flux: "00000000-0000-4000-8000-000000000504",
  },
  actions: {
    rebalanceOwner: "00000000-0000-4000-8000-000000000601",
    approveInvoiceRules: "00000000-0000-4000-8000-000000000602",
    notifyCustomerRisk: "00000000-0000-4000-8000-000000000603",
    rerunProjection: "00000000-0000-4000-8000-000000000604",
    createEscalationTask: "00000000-0000-4000-8000-000000000605",
  },
  events: {
    orgCreated: "00000000-0000-4000-8000-000000000701",
    workspaceCreated: "00000000-0000-4000-8000-000000000702",
    launchCreated: "00000000-0000-4000-8000-000000000703",
    taskAssigned: "00000000-0000-4000-8000-000000000704",
    taskBlocked: "00000000-0000-4000-8000-000000000705",
    agentActivated: "00000000-0000-4000-8000-000000000706",
    actionPending: "00000000-0000-4000-8000-000000000707",
    actionApproved: "00000000-0000-4000-8000-000000000708",
    actionExecuted: "00000000-0000-4000-8000-000000000709",
    customerDigest: "00000000-0000-4000-8000-000000000710",
    financeReview: "00000000-0000-4000-8000-000000000711",
    notificationRead: "00000000-0000-4000-8000-000000000712",
  },
  notifications: {
    approvalNeeded: "00000000-0000-4000-8000-000000000801",
    taskAssigned: "00000000-0000-4000-8000-000000000802",
    riskBlocked: "00000000-0000-4000-8000-000000000803",
    launchDigest: "00000000-0000-4000-8000-000000000804",
    projectionFailed: "00000000-0000-4000-8000-000000000805",
    financeApproved: "00000000-0000-4000-8000-000000000806",
    customerSla: "00000000-0000-4000-8000-000000000807",
    readWelcome: "00000000-0000-4000-8000-000000000808",
  },
} as const;

const at = (isoDate: string) => new Date(isoDate);

async function guardDemoSlug() {
  const existing = await prisma.organization.findUnique({
    where: { slug: "acme-operations-lab" },
    select: { id: true },
  });

  if (existing && existing.id !== ids.org) {
    throw new Error(
      "Cannot seed demo data: organization slug acme-operations-lab already exists with a different id.",
    );
  }
}

async function seedOrganization() {
  await prisma.organization.upsert({
    where: { id: ids.org },
    update: {
      name: "Acme Operations Lab",
      slug: "acme-operations-lab",
      plan: Plan.BUSINESS,
      graphNodeId: "neo4j:organization:acme-operations-lab",
      stripeCustId: "cus_demo_acme_operations_lab",
      settings: {
        aiApprovalsRequired: true,
        defaultTimezone: "Asia/Dhaka",
        enabledModules: ["projects", "agents", "events", "billing"],
      },
    },
    create: {
      id: ids.org,
      name: "Acme Operations Lab",
      slug: "acme-operations-lab",
      plan: Plan.BUSINESS,
      graphNodeId: "neo4j:organization:acme-operations-lab",
      stripeCustId: "cus_demo_acme_operations_lab",
      settings: {
        aiApprovalsRequired: true,
        defaultTimezone: "Asia/Dhaka",
        enabledModules: ["projects", "agents", "events", "billing"],
      },
      createdAt: at("2026-05-01T08:00:00.000Z"),
    },
  });
}

async function seedUsers() {
  const users = [
    {
      id: ids.users.mohammad,
      email: "mohammad@acme.example",
      name: "Mohammad Habib",
      avatarUrl: "s3://sentient-dev/avatars/mohammad.png",
      role: UserRole.ORG_ADMIN,
      attributes: { department: "executive", location: "Dhaka", canApproveAgents: true },
      lastActiveAt: at("2026-05-24T15:30:00.000Z"),
    },
    {
      id: ids.users.aisha,
      email: "aisha@acme.example",
      name: "Aisha Rahman",
      avatarUrl: "s3://sentient-dev/avatars/aisha.png",
      role: UserRole.MANAGER,
      attributes: { department: "operations", location: "Dhaka", canApproveAgents: true },
      lastActiveAt: at("2026-05-24T13:12:00.000Z"),
    },
    {
      id: ids.users.daniel,
      email: "daniel@acme.example",
      name: "Daniel Kim",
      avatarUrl: "s3://sentient-dev/avatars/daniel.png",
      role: UserRole.MEMBER,
      attributes: { department: "engineering", location: "Singapore", canApproveAgents: false },
      lastActiveAt: at("2026-05-23T21:45:00.000Z"),
    },
    {
      id: ids.users.priya,
      email: "priya@acme.example",
      name: "Priya Shah",
      avatarUrl: "s3://sentient-dev/avatars/priya.png",
      role: UserRole.MEMBER,
      attributes: { department: "finance", location: "Mumbai", canApproveAgents: false },
      lastActiveAt: at("2026-05-24T09:05:00.000Z"),
    },
    {
      id: ids.users.omar,
      email: "omar@acme.example",
      name: "Omar Faruque",
      avatarUrl: "s3://sentient-dev/avatars/omar.png",
      role: UserRole.GUEST,
      attributes: { department: "support", location: "Dhaka", canApproveAgents: false },
      lastActiveAt: at("2026-05-22T11:20:00.000Z"),
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        orgId: ids.org,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        attributes: user.attributes,
        passwordHash: DEMO_PASSWORD_HASH_PLACEHOLDER,
        emailVerified: true,
        lastActiveAt: user.lastActiveAt,
      },
      create: {
        ...user,
        orgId: ids.org,
        passwordHash: DEMO_PASSWORD_HASH_PLACEHOLDER,
        emailVerified: true,
        createdAt: at("2026-05-01T09:00:00.000Z"),
      },
    });
  }
}

async function seedWorkspaces() {
  const workspaces = [
    {
      id: ids.workspaces.operations,
      name: "Operations Command",
      description:
        "Day-to-day operating rhythm, launch coordination, support, and finance workflows.",
      graphNodeId: "neo4j:workspace:operations-command",
      settings: { visibility: "organization", defaultBoard: "kanban", wipLimit: 6 },
      createdBy: ids.users.mohammad,
      createdAt: at("2026-05-02T08:00:00.000Z"),
    },
    {
      id: ids.workspaces.product,
      name: "Product Delivery",
      description:
        "Engineering and AI-native product delivery for Sentient's first operating loop.",
      graphNodeId: "neo4j:workspace:product-delivery",
      settings: { visibility: "organization", defaultBoard: "delivery", wipLimit: 5 },
      createdBy: ids.users.daniel,
      createdAt: at("2026-05-02T08:20:00.000Z"),
    },
  ];

  for (const workspace of workspaces) {
    await prisma.workspace.upsert({
      where: { id: workspace.id },
      update: {
        orgId: ids.org,
        name: workspace.name,
        description: workspace.description,
        graphNodeId: workspace.graphNodeId,
        settings: workspace.settings,
        createdBy: workspace.createdBy,
      },
      create: {
        ...workspace,
        orgId: ids.org,
      },
    });
  }
}

async function seedProjects() {
  const projects = [
    {
      id: ids.projects.launch,
      workspaceId: ids.workspaces.operations,
      name: "Q3 Launch Readiness",
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      dueDate: at("2026-07-15T00:00:00.000Z"),
      graphNodeId: "neo4j:project:q3-launch-readiness",
      metadata: { launchTier: "board-visible", targetMarkets: ["BD", "SG", "IN"] },
      createdBy: ids.users.aisha,
      createdAt: at("2026-05-03T09:00:00.000Z"),
    },
    {
      id: ids.projects.escalation,
      workspaceId: ids.workspaces.operations,
      name: "Customer Escalation Workflow",
      status: ProjectStatus.ACTIVE,
      priority: Priority.CRITICAL,
      dueDate: at("2026-06-10T00:00:00.000Z"),
      graphNodeId: "neo4j:project:customer-escalation-workflow",
      metadata: { customerSegment: "enterprise", slaHours: 4 },
      createdBy: ids.users.aisha,
      createdAt: at("2026-05-04T10:30:00.000Z"),
    },
    {
      id: ids.projects.platform,
      workspaceId: ids.workspaces.product,
      name: "Sentient Core Platform",
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      dueDate: at("2026-06-30T00:00:00.000Z"),
      graphNodeId: "neo4j:project:sentient-core-platform",
      metadata: { release: "phase-0", architecture: "modular-monolith" },
      createdBy: ids.users.daniel,
      createdAt: at("2026-05-05T11:00:00.000Z"),
    },
    {
      id: ids.projects.finance,
      workspaceId: ids.workspaces.operations,
      name: "Finance Automation Pilot",
      status: ProjectStatus.PAUSED,
      priority: Priority.MEDIUM,
      dueDate: at("2026-08-01T00:00:00.000Z"),
      graphNodeId: "neo4j:project:finance-automation-pilot",
      metadata: { pilotScope: ["invoice-review", "variance-alerts"], budgetOwner: "Priya Shah" },
      createdBy: ids.users.priya,
      createdAt: at("2026-05-06T12:00:00.000Z"),
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        workspaceId: project.workspaceId,
        orgId: ids.org,
        name: project.name,
        status: project.status,
        priority: project.priority,
        dueDate: project.dueDate,
        graphNodeId: project.graphNodeId,
        metadata: project.metadata,
        createdBy: project.createdBy,
      },
      create: {
        ...project,
        orgId: ids.org,
      },
    });
  }
}

async function seedTasks() {
  const tasks = [
    {
      id: ids.tasks.launchPlan,
      projectId: ids.projects.launch,
      title: "Finalize cross-functional launch plan",
      description:
        "Consolidate GTM, support, finance, and engineering dependencies into one launch plan.",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      assigneeId: ids.users.aisha,
      dueDate: at("2026-06-01T10:00:00.000Z"),
      estimatedHours: "12.50",
      graphNodeId: "neo4j:task:finalize-launch-plan",
      position: 1,
      createdBy: ids.users.mohammad,
      createdAt: at("2026-05-07T08:10:00.000Z"),
    },
    {
      id: ids.tasks.vendorReadiness,
      projectId: ids.projects.launch,
      title: "Confirm vendor readiness checklist",
      description: "Validate launch-day availability from analytics, email, and billing vendors.",
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      assigneeId: ids.users.omar,
      dueDate: at("2026-06-04T10:00:00.000Z"),
      estimatedHours: "6.00",
      graphNodeId: "neo4j:task:vendor-readiness",
      position: 2,
      createdBy: ids.users.aisha,
      createdAt: at("2026-05-07T09:15:00.000Z"),
    },
    {
      id: ids.tasks.execBriefing,
      projectId: ids.projects.launch,
      title: "Prepare executive launch briefing",
      description:
        "Summarize launch risks, open decisions, staffing plan, and expected customer impact.",
      status: TaskStatus.REVIEW,
      priority: Priority.HIGH,
      assigneeId: ids.users.mohammad,
      dueDate: at("2026-05-30T12:00:00.000Z"),
      estimatedHours: "5.50",
      graphNodeId: "neo4j:task:executive-briefing",
      position: 3,
      createdBy: ids.users.aisha,
      createdAt: at("2026-05-08T08:30:00.000Z"),
    },
    {
      id: ids.tasks.riskReview,
      projectId: ids.projects.launch,
      title: "Review launch risk register",
      description: "Re-score critical launch risks and assign mitigation owners.",
      status: TaskStatus.BLOCKED,
      priority: Priority.CRITICAL,
      assigneeId: ids.users.aisha,
      dueDate: at("2026-05-28T15:00:00.000Z"),
      estimatedHours: "4.00",
      graphNodeId: "neo4j:task:risk-register-review",
      position: 4,
      createdBy: ids.users.mohammad,
      createdAt: at("2026-05-08T09:20:00.000Z"),
    },
    {
      id: ids.tasks.supportMacros,
      projectId: ids.projects.escalation,
      title: "Draft priority support macros",
      description: "Create templated responses for top five enterprise escalation categories.",
      status: TaskStatus.DONE,
      priority: Priority.MEDIUM,
      assigneeId: ids.users.omar,
      dueDate: at("2026-05-25T10:00:00.000Z"),
      estimatedHours: "8.00",
      graphNodeId: "neo4j:task:support-macros",
      position: 1,
      createdBy: ids.users.aisha,
      createdAt: at("2026-05-09T07:45:00.000Z"),
    },
    {
      id: ids.tasks.escalationSla,
      projectId: ids.projects.escalation,
      title: "Define enterprise escalation SLA matrix",
      description: "Map severity levels to owner, response time, and approval requirements.",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      assigneeId: ids.users.aisha,
      dueDate: at("2026-05-31T09:00:00.000Z"),
      estimatedHours: "9.00",
      graphNodeId: "neo4j:task:enterprise-sla-matrix",
      position: 2,
      createdBy: ids.users.mohammad,
      createdAt: at("2026-05-09T10:00:00.000Z"),
    },
    {
      id: ids.tasks.customerDigest,
      projectId: ids.projects.escalation,
      title: "Create weekly customer risk digest",
      description: "Aggregate escalations, renewal risk, sentiment, and unresolved blockers.",
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      assigneeId: ids.users.omar,
      dueDate: at("2026-06-03T09:00:00.000Z"),
      estimatedHours: "7.50",
      graphNodeId: "neo4j:task:customer-risk-digest",
      position: 3,
      createdBy: ids.users.aisha,
      createdAt: at("2026-05-10T08:00:00.000Z"),
    },
    {
      id: ids.tasks.ingestionApi,
      projectId: ids.projects.platform,
      title: "Implement event ingestion API contract",
      description:
        "Define request validation, tenant scoping, and append-only event write behavior.",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      assigneeId: ids.users.daniel,
      dueDate: at("2026-06-07T11:00:00.000Z"),
      estimatedHours: "16.00",
      graphNodeId: "neo4j:task:event-ingestion-api",
      position: 1,
      createdBy: ids.users.daniel,
      createdAt: at("2026-05-10T13:15:00.000Z"),
    },
    {
      id: ids.tasks.eventProjection,
      projectId: ids.projects.platform,
      title: "Build first CQRS event projection",
      description: "Project task and agent action events into a query-friendly activity feed.",
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      assigneeId: ids.users.daniel,
      dueDate: at("2026-06-14T11:00:00.000Z"),
      estimatedHours: "14.00",
      graphNodeId: "neo4j:task:cqrs-event-projection",
      position: 2,
      createdBy: ids.users.daniel,
      createdAt: at("2026-05-11T09:30:00.000Z"),
    },
    {
      id: ids.tasks.approvalFlow,
      projectId: ids.projects.platform,
      title: "Design human approval workflow",
      description:
        "Specify pending, approved, rejected, expired, executed, and failed transitions.",
      status: TaskStatus.REVIEW,
      priority: Priority.CRITICAL,
      assigneeId: ids.users.mohammad,
      dueDate: at("2026-06-05T15:00:00.000Z"),
      estimatedHours: "10.00",
      graphNodeId: "neo4j:task:human-approval-workflow",
      position: 3,
      createdBy: ids.users.daniel,
      createdAt: at("2026-05-11T11:20:00.000Z"),
    },
    {
      id: ids.tasks.mobileApproval,
      projectId: ids.projects.platform,
      parentTaskId: ids.tasks.approvalFlow,
      title: "Prototype mobile approval screen",
      description: "Create the first approve/reject screen for pending agent actions.",
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      assigneeId: ids.users.daniel,
      dueDate: at("2026-06-08T15:00:00.000Z"),
      estimatedHours: "8.00",
      graphNodeId: "neo4j:task:mobile-approval-screen",
      position: 4,
      createdBy: ids.users.mohammad,
      createdAt: at("2026-05-12T08:40:00.000Z"),
    },
    {
      id: ids.tasks.graphConstraints,
      projectId: ids.projects.platform,
      parentTaskId: ids.tasks.eventProjection,
      title: "Define Neo4j graph constraints",
      description: "Document node uniqueness and relationship constraints for business entities.",
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      assigneeId: ids.users.daniel,
      dueDate: at("2026-06-12T15:00:00.000Z"),
      estimatedHours: "6.50",
      graphNodeId: "neo4j:task:graph-constraints",
      position: 5,
      createdBy: ids.users.daniel,
      createdAt: at("2026-05-12T10:00:00.000Z"),
    },
    {
      id: ids.tasks.invoiceRules,
      projectId: ids.projects.finance,
      title: "Map invoice approval rules",
      description: "Capture thresholds, exception paths, and monthly close constraints.",
      status: TaskStatus.REVIEW,
      priority: Priority.MEDIUM,
      assigneeId: ids.users.priya,
      dueDate: at("2026-06-18T10:00:00.000Z"),
      estimatedHours: "11.00",
      graphNodeId: "neo4j:task:invoice-approval-rules",
      position: 1,
      createdBy: ids.users.priya,
      createdAt: at("2026-05-13T09:00:00.000Z"),
    },
    {
      id: ids.tasks.financeDashboard,
      projectId: ids.projects.finance,
      title: "Sketch finance automation dashboard",
      description: "Draft KPI layout for spend variance, approvals, and agent-suggested actions.",
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      assigneeId: ids.users.priya,
      dueDate: at("2026-07-01T10:00:00.000Z"),
      estimatedHours: "7.00",
      graphNodeId: "neo4j:task:finance-dashboard",
      position: 2,
      createdBy: ids.users.priya,
      createdAt: at("2026-05-13T10:30:00.000Z"),
    },
    {
      id: ids.tasks.reconciliationRunbook,
      projectId: ids.projects.finance,
      title: "Write reconciliation exception runbook",
      description:
        "Document manual fallback steps for failed invoice matching and disputed vendors.",
      status: TaskStatus.BLOCKED,
      priority: Priority.HIGH,
      assigneeId: ids.users.priya,
      dueDate: at("2026-06-24T10:00:00.000Z"),
      estimatedHours: "9.50",
      graphNodeId: "neo4j:task:reconciliation-runbook",
      position: 3,
      createdBy: ids.users.mohammad,
      createdAt: at("2026-05-14T08:30:00.000Z"),
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {
        projectId: task.projectId,
        orgId: ids.org,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        parentTaskId: task.parentTaskId ?? null,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        graphNodeId: task.graphNodeId,
        position: task.position,
        createdBy: task.createdBy,
      },
      create: {
        ...task,
        orgId: ids.org,
        parentTaskId: task.parentTaskId ?? null,
        updatedAt: task.createdAt,
      },
    });
  }
}

async function seedAgents() {
  const agents = [
    {
      id: ids.agents.aria,
      name: "Aria",
      type: AgentType.OPERATIONS,
      config: {
        mission: "Detect operational bottlenecks and propose task or staffing adjustments.",
        tools: ["tasks.read", "tasks.propose_update", "events.append"],
        riskThreshold: "medium",
      },
      memoryNs: "agent:aria:operations",
      approvalMode: ApprovalMode.ALWAYS,
      actionsCount: 42,
      createdBy: ids.users.mohammad,
      createdAt: at("2026-05-15T08:00:00.000Z"),
    },
    {
      id: ids.agents.nova,
      name: "Nova",
      type: AgentType.FINANCE,
      config: {
        mission: "Monitor spend, invoice approvals, and budget variance.",
        tools: ["billing.read", "tasks.propose_create", "events.append"],
        riskThreshold: "low",
      },
      memoryNs: "agent:nova:finance",
      approvalMode: ApprovalMode.ALWAYS,
      actionsCount: 18,
      createdBy: ids.users.priya,
      createdAt: at("2026-05-15T08:20:00.000Z"),
    },
    {
      id: ids.agents.echo,
      name: "Echo",
      type: AgentType.CUSTOMER,
      config: {
        mission: "Summarize customer risk and recommend support follow-up.",
        tools: ["notifications.create", "tasks.propose_create", "events.append"],
        riskThreshold: "medium",
      },
      memoryNs: "agent:echo:customer",
      approvalMode: ApprovalMode.ALWAYS,
      actionsCount: 27,
      createdBy: ids.users.aisha,
      createdAt: at("2026-05-15T08:40:00.000Z"),
    },
    {
      id: ids.agents.flux,
      name: "Flux",
      type: AgentType.DEV,
      config: {
        mission: "Watch platform delivery risks and propose engineering follow-ups.",
        tools: ["projects.read", "tasks.propose_update", "events.append"],
        riskThreshold: "high",
      },
      memoryNs: "agent:flux:dev",
      approvalMode: ApprovalMode.AUTO_LOW_RISK,
      actionsCount: 31,
      createdBy: ids.users.daniel,
      createdAt: at("2026-05-15T09:00:00.000Z"),
    },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: {
        orgId: ids.org,
        name: agent.name,
        type: agent.type,
        config: agent.config,
        memoryNs: agent.memoryNs,
        isActive: true,
        approvalMode: agent.approvalMode,
        actionsCount: agent.actionsCount,
        createdBy: agent.createdBy,
      },
      create: {
        ...agent,
        orgId: ids.org,
        isActive: true,
      },
    });
  }
}

async function seedAgentActions() {
  const actions = [
    {
      id: ids.actions.rebalanceOwner,
      agentId: ids.agents.aria,
      actionType: "reassign_task",
      payload: {
        taskId: ids.tasks.riskReview,
        fromUserId: ids.users.aisha,
        toUserId: ids.users.mohammad,
        reason: "Critical launch risk needs executive decision.",
      },
      status: AgentActionStatus.PENDING,
      approvedBy: null,
      approvedAt: null,
      executedAt: null,
      result: Prisma.JsonNull,
      expiresAt: at("2026-05-26T09:00:00.000Z"),
      createdAt: at("2026-05-24T09:00:00.000Z"),
    },
    {
      id: ids.actions.approveInvoiceRules,
      agentId: ids.agents.nova,
      actionType: "approve_invoice_rule_draft",
      payload: {
        taskId: ids.tasks.invoiceRules,
        ruleSet: "standard-vendor-thresholds",
        thresholdUsd: 5000,
      },
      status: AgentActionStatus.APPROVED,
      approvedBy: ids.users.mohammad,
      approvedAt: at("2026-05-24T10:15:00.000Z"),
      executedAt: null,
      result: Prisma.JsonNull,
      expiresAt: at("2026-05-27T10:00:00.000Z"),
      createdAt: at("2026-05-24T09:40:00.000Z"),
    },
    {
      id: ids.actions.notifyCustomerRisk,
      agentId: ids.agents.echo,
      actionType: "send_customer_risk_digest",
      payload: {
        projectId: ids.projects.escalation,
        audience: "support-leads",
        riskCount: 7,
      },
      status: AgentActionStatus.REJECTED,
      approvedBy: ids.users.aisha,
      approvedAt: at("2026-05-23T12:30:00.000Z"),
      executedAt: null,
      result: { rejectedReason: "Digest needs legal review before external sharing." },
      expiresAt: at("2026-05-25T12:00:00.000Z"),
      createdAt: at("2026-05-23T11:45:00.000Z"),
    },
    {
      id: ids.actions.rerunProjection,
      agentId: ids.agents.flux,
      actionType: "rerun_event_projection",
      payload: {
        projectId: ids.projects.platform,
        projection: "activity-feed",
        since: "2026-05-20T00:00:00.000Z",
      },
      status: AgentActionStatus.EXECUTED,
      approvedBy: ids.users.daniel,
      approvedAt: at("2026-05-22T08:20:00.000Z"),
      executedAt: at("2026-05-22T08:25:00.000Z"),
      result: { projectedEvents: 128, durationMs: 1842 },
      expiresAt: at("2026-05-24T08:00:00.000Z"),
      createdAt: at("2026-05-22T08:00:00.000Z"),
    },
    {
      id: ids.actions.createEscalationTask,
      agentId: ids.agents.echo,
      actionType: "create_escalation_task",
      payload: {
        projectId: ids.projects.escalation,
        suggestedTitle: "Follow up with enterprise account Northstar Foods",
      },
      status: AgentActionStatus.FAILED,
      approvedBy: ids.users.aisha,
      approvedAt: at("2026-05-21T14:00:00.000Z"),
      executedAt: at("2026-05-21T14:03:00.000Z"),
      result: { error: "Duplicate task detected for same customer and escalation window." },
      expiresAt: at("2026-05-23T14:00:00.000Z"),
      createdAt: at("2026-05-21T13:45:00.000Z"),
    },
  ];

  for (const action of actions) {
    await prisma.agentAction.upsert({
      where: { id: action.id },
      update: {
        agentId: action.agentId,
        orgId: ids.org,
        actionType: action.actionType,
        payload: action.payload,
        status: action.status,
        approvedBy: action.approvedBy,
        approvedAt: action.approvedAt,
        executedAt: action.executedAt,
        result: action.result,
        expiresAt: action.expiresAt,
      },
      create: {
        ...action,
        orgId: ids.org,
      },
    });
  }
}

async function seedEvents() {
  const events = [
    {
      id: ids.events.orgCreated,
      type: "organization.created",
      aggregateId: ids.org,
      aggregateType: "organization",
      payload: { name: "Acme Operations Lab", plan: "business" },
      actorId: ids.system,
      actorType: ActorType.SYSTEM,
      version: 1,
      occurredAt: at("2026-05-01T08:00:00.000Z"),
    },
    {
      id: ids.events.workspaceCreated,
      type: "workspace.created",
      aggregateId: ids.workspaces.operations,
      aggregateType: "workspace",
      payload: { name: "Operations Command" },
      actorId: ids.users.mohammad,
      actorType: ActorType.USER,
      version: 1,
      occurredAt: at("2026-05-02T08:00:00.000Z"),
    },
    {
      id: ids.events.launchCreated,
      type: "project.created",
      aggregateId: ids.projects.launch,
      aggregateType: "project",
      payload: { name: "Q3 Launch Readiness", priority: "high" },
      actorId: ids.users.aisha,
      actorType: ActorType.USER,
      version: 1,
      occurredAt: at("2026-05-03T09:00:00.000Z"),
    },
    {
      id: ids.events.taskAssigned,
      type: "task.assigned",
      aggregateId: ids.tasks.ingestionApi,
      aggregateType: "task",
      payload: { assigneeId: ids.users.daniel, projectId: ids.projects.platform },
      actorId: ids.users.daniel,
      actorType: ActorType.USER,
      version: 1,
      occurredAt: at("2026-05-10T13:15:00.000Z"),
    },
    {
      id: ids.events.taskBlocked,
      type: "task.blocked",
      aggregateId: ids.tasks.riskReview,
      aggregateType: "task",
      payload: { blocker: "Waiting for board decision on rollout criteria." },
      actorId: ids.users.aisha,
      actorType: ActorType.USER,
      version: 2,
      occurredAt: at("2026-05-20T09:30:00.000Z"),
    },
    {
      id: ids.events.agentActivated,
      type: "agent.activated",
      aggregateId: ids.agents.aria,
      aggregateType: "agent",
      payload: { name: "Aria", type: "operations" },
      actorId: ids.users.mohammad,
      actorType: ActorType.USER,
      version: 1,
      occurredAt: at("2026-05-15T08:00:00.000Z"),
    },
    {
      id: ids.events.actionPending,
      type: "agent.action.pending",
      aggregateId: ids.actions.rebalanceOwner,
      aggregateType: "agent_action",
      payload: { actionType: "reassign_task", risk: "medium" },
      actorId: ids.agents.aria,
      actorType: ActorType.AGENT,
      version: 1,
      occurredAt: at("2026-05-24T09:00:00.000Z"),
    },
    {
      id: ids.events.actionApproved,
      type: "agent.action.approved",
      aggregateId: ids.actions.approveInvoiceRules,
      aggregateType: "agent_action",
      payload: { approvedBy: ids.users.mohammad },
      actorId: ids.users.mohammad,
      actorType: ActorType.USER,
      version: 2,
      occurredAt: at("2026-05-24T10:15:00.000Z"),
    },
    {
      id: ids.events.actionExecuted,
      type: "agent.action.executed",
      aggregateId: ids.actions.rerunProjection,
      aggregateType: "agent_action",
      payload: { projectedEvents: 128, durationMs: 1842 },
      actorId: ids.agents.flux,
      actorType: ActorType.AGENT,
      version: 3,
      occurredAt: at("2026-05-22T08:25:00.000Z"),
    },
    {
      id: ids.events.customerDigest,
      type: "customer.digest.generated",
      aggregateId: ids.projects.escalation,
      aggregateType: "project",
      payload: { riskCount: 7, ownerId: ids.users.omar },
      actorId: ids.agents.echo,
      actorType: ActorType.AGENT,
      version: 2,
      occurredAt: at("2026-05-23T11:45:00.000Z"),
    },
    {
      id: ids.events.financeReview,
      type: "finance.rule.reviewed",
      aggregateId: ids.tasks.invoiceRules,
      aggregateType: "task",
      payload: { reviewerId: ids.users.priya, thresholdUsd: 5000 },
      actorId: ids.agents.nova,
      actorType: ActorType.AGENT,
      version: 2,
      occurredAt: at("2026-05-24T09:40:00.000Z"),
    },
    {
      id: ids.events.notificationRead,
      type: "notification.read",
      aggregateId: ids.notifications.readWelcome,
      aggregateType: "notification",
      payload: { userId: ids.users.mohammad },
      actorId: ids.users.mohammad,
      actorType: ActorType.USER,
      version: 1,
      occurredAt: at("2026-05-16T08:10:00.000Z"),
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: {
        id_occurredAt: {
          id: event.id,
          occurredAt: event.occurredAt,
        },
      },
      update: {
        orgId: ids.org,
        type: event.type,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        payload: event.payload,
        actorId: event.actorId,
        actorType: event.actorType,
        version: event.version,
      },
      create: {
        ...event,
        orgId: ids.org,
      },
    });
  }
}

async function seedNotifications() {
  const notifications = [
    {
      id: ids.notifications.approvalNeeded,
      userId: ids.users.mohammad,
      type: "agent_approval_needed",
      title: "Aria needs approval",
      body: "Aria recommends reassigning the launch risk review for executive decision.",
      data: { actionId: ids.actions.rebalanceOwner, taskId: ids.tasks.riskReview },
      read: false,
      readAt: null,
      createdAt: at("2026-05-24T09:01:00.000Z"),
    },
    {
      id: ids.notifications.taskAssigned,
      userId: ids.users.daniel,
      type: "task_assigned",
      title: "New platform task assigned",
      body: "Implement event ingestion API contract is now assigned to you.",
      data: { taskId: ids.tasks.ingestionApi, projectId: ids.projects.platform },
      read: false,
      readAt: null,
      createdAt: at("2026-05-10T13:16:00.000Z"),
    },
    {
      id: ids.notifications.riskBlocked,
      userId: ids.users.aisha,
      type: "task_blocked",
      title: "Launch risk review is blocked",
      body: "The launch risk register needs a board decision before it can move forward.",
      data: { taskId: ids.tasks.riskReview, severity: "critical" },
      read: false,
      readAt: null,
      createdAt: at("2026-05-20T09:31:00.000Z"),
    },
    {
      id: ids.notifications.launchDigest,
      userId: ids.users.mohammad,
      type: "project_digest",
      title: "Q3 launch digest ready",
      body: "The latest launch readiness summary is ready for review.",
      data: { projectId: ids.projects.launch, openCriticalTasks: 1 },
      read: false,
      readAt: null,
      createdAt: at("2026-05-24T07:00:00.000Z"),
    },
    {
      id: ids.notifications.projectionFailed,
      userId: ids.users.daniel,
      type: "agent_action_failed",
      title: "Echo action failed",
      body: "Echo could not create a duplicate escalation task.",
      data: { actionId: ids.actions.createEscalationTask, agentId: ids.agents.echo },
      read: false,
      readAt: null,
      createdAt: at("2026-05-21T14:04:00.000Z"),
    },
    {
      id: ids.notifications.financeApproved,
      userId: ids.users.priya,
      type: "agent_action_approved",
      title: "Finance rule draft approved",
      body: "Mohammad approved Nova's invoice rule recommendation.",
      data: { actionId: ids.actions.approveInvoiceRules, taskId: ids.tasks.invoiceRules },
      read: true,
      readAt: at("2026-05-24T10:30:00.000Z"),
      createdAt: at("2026-05-24T10:16:00.000Z"),
    },
    {
      id: ids.notifications.customerSla,
      userId: ids.users.omar,
      type: "task_due_soon",
      title: "Customer digest due soon",
      body: "Create weekly customer risk digest is due next week.",
      data: { taskId: ids.tasks.customerDigest, dueDate: "2026-06-03T09:00:00.000Z" },
      read: false,
      readAt: null,
      createdAt: at("2026-05-24T06:45:00.000Z"),
    },
    {
      id: ids.notifications.readWelcome,
      userId: ids.users.mohammad,
      type: "welcome",
      title: "Welcome to Sentient",
      body: "Your demo workspace and AI agents are ready.",
      data: { orgId: ids.org },
      read: true,
      readAt: at("2026-05-16T08:10:00.000Z"),
      createdAt: at("2026-05-16T08:00:00.000Z"),
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: {
        userId: notification.userId,
        orgId: ids.org,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        read: notification.read,
        readAt: notification.readAt,
      },
      create: {
        ...notification,
        orgId: ids.org,
      },
    });
  }
}

async function main() {
  await guardDemoSlug();
  await seedOrganization();
  await seedUsers();
  await seedWorkspaces();
  await seedProjects();
  await seedTasks();
  await seedAgents();
  await seedAgentActions();
  await seedEvents();
  await seedNotifications();

  console.log("Seeded Sentient demo data:");
  console.log("- 1 organization");
  console.log("- 5 users");
  console.log("- 2 workspaces");
  console.log("- 4 projects");
  console.log("- 15 tasks");
  console.log("- 4 agents");
  console.log("- 5 agent actions");
  console.log("- 12 events");
  console.log("- 8 notifications");
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed database.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
