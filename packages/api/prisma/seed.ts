import {
  AgentType,
  ActorType,
  Plan,
  PrismaClient,
  ProjectStatus,
  Priority,
  TaskStatus,
  UserRole,
  SubscriptionStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://sentient:sentient@localhost:5432/sentient",
});

const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  await prisma.agentAction.deleteMany();
  await prisma.event.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: "Acme Corp",
      slug: "acme-corp",
      plan: Plan.PRO,
      graphNodeId: "org-acme-corp",
      settings: {
        timezone: "Asia/Dhaka",
        locale: "en-US",
      },
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        orgId: org.id,
        email: "mohammad.habib@acme.com",
        name: "Mohammad Habib",
        role: UserRole.SUPER_ADMIN,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        orgId: org.id,
        email: "admin@acme.com",
        name: "Ava Admin",
        role: UserRole.ORG_ADMIN,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        orgId: org.id,
        email: "manager@acme.com",
        name: "Mason Manager",
        role: UserRole.MANAGER,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        orgId: org.id,
        email: "member.one@acme.com",
        name: "Mila Member",
        role: UserRole.MEMBER,
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        orgId: org.id,
        email: "member.two@acme.com",
        name: "Noah Member",
        role: UserRole.MEMBER,
        emailVerified: true,
      },
    }),
  ]);

  const superAdmin = users[0];
  const manager = users[2];
  const memberOne = users[3];
  const memberTwo = users[4];

  const engineering = await prisma.workspace.create({
    data: {
      orgId: org.id,
      name: "Engineering",
      description: "Product engineering workspace",
      graphNodeId: "ws-engineering",
      createdBy: superAdmin.id,
    },
  });

  const marketing = await prisma.workspace.create({
    data: {
      orgId: org.id,
      name: "Marketing",
      description: "Growth and content workspace",
      graphNodeId: "ws-marketing",
      createdBy: superAdmin.id,
    },
  });

  const projects = await Promise.all([
    prisma.project.create({
      data: {
        orgId: org.id,
        workspaceId: engineering.id,
        name: "Platform Revamp",
        metadata: { description: "Modernize core platform services" },
        status: ProjectStatus.ACTIVE,
        priority: Priority.HIGH,
        graphNodeId: "proj-platform-revamp",
        createdBy: superAdmin.id,
      },
    }),
    prisma.project.create({
      data: {
        orgId: org.id,
        workspaceId: engineering.id,
        name: "Mobile Launch",
        metadata: { description: "iOS and Android launch readiness" },
        status: ProjectStatus.PAUSED,
        priority: Priority.MEDIUM,
        graphNodeId: "proj-mobile-launch",
        createdBy: manager.id,
      },
    }),
    prisma.project.create({
      data: {
        orgId: org.id,
        workspaceId: marketing.id,
        name: "Brand Refresh",
        metadata: { description: "Website and campaign rebrand" },
        status: ProjectStatus.COMPLETED,
        priority: Priority.LOW,
        graphNodeId: "proj-brand-refresh",
        createdBy: superAdmin.id,
      },
    }),
    prisma.project.create({
      data: {
        orgId: org.id,
        workspaceId: marketing.id,
        name: "Channel Expansion",
        metadata: { description: "Pilot new acquisition channels" },
        status: ProjectStatus.ARCHIVED,
        priority: Priority.CRITICAL,
        graphNodeId: "proj-channel-expansion",
        createdBy: manager.id,
      },
    }),
  ]);

  const taskStatuses: TaskStatus[] = [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.REVIEW,
    TaskStatus.DONE,
    TaskStatus.BLOCKED,
  ];
  const taskPriorities: Priority[] = [
    Priority.LOW,
    Priority.MEDIUM,
    Priority.HIGH,
    Priority.CRITICAL,
  ];

  const taskData = taskStatuses.flatMap((status, statusIdx) =>
    taskPriorities.map((priority, priorityIdx) => {
      const index = statusIdx * taskPriorities.length + priorityIdx;
      const project = projects[index % projects.length];
      const assignee =
        index % 3 === 0
          ? manager.id
          : index % 3 === 1
            ? memberOne.id
            : index % 2 === 0
              ? memberTwo.id
              : null;

      return {
        orgId: org.id,
        projectId: project.id,
        title: `Task ${index + 1}: ${status} / ${priority}`,
        description: `Seeded task for status ${status} and priority ${priority}.`,
        status,
        priority,
        assigneeId: assignee,
        dueDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
        estimatedHours: (index % 8) + 1,
        graphNodeId: `task-${index + 1}`,
        createdBy: superAdmin.id,
      };
    }),
  );

  await prisma.task.createMany({ data: taskData });

  await Promise.all([
    prisma.agent.create({
      data: {
        orgId: org.id,
        name: "Aria",
        type: AgentType.OPERATIONS,
        config: { specialty: "operations" },
        memoryNs: "acme/operations",
        isActive: true,
        createdBy: superAdmin.id,
      },
    }),
    prisma.agent.create({
      data: {
        orgId: org.id,
        name: "Nova",
        type: AgentType.FINANCE,
        config: { specialty: "finance" },
        memoryNs: "acme/finance",
        isActive: true,
        createdBy: superAdmin.id,
      },
    }),
    prisma.agent.create({
      data: {
        orgId: org.id,
        name: "Echo",
        type: AgentType.CUSTOMER,
        config: { specialty: "customer" },
        memoryNs: "acme/customer",
        isActive: true,
        createdBy: superAdmin.id,
      },
    }),
    prisma.agent.create({
      data: {
        orgId: org.id,
        name: "Flux",
        type: AgentType.DEV,
        config: { specialty: "dev" },
        memoryNs: "acme/dev",
        isActive: true,
        createdBy: superAdmin.id,
      },
    }),
  ]);

  await prisma.subscription.create({
    data: {
      orgId: org.id,
      plan: Plan.PRO,
      status: SubscriptionStatus.ACTIVE,
      actionsLimit: BigInt(10000),
      actionsUsed: BigInt(250),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const actorTypes: ActorType[] = [ActorType.USER, ActorType.AGENT, ActorType.SYSTEM];
  const eventTypes = [
    "org.created",
    "user.invited",
    "workspace.created",
    "project.updated",
    "task.status_changed",
    "agent.executed",
  ];
  const aggregateTypes = ["organization", "user", "workspace", "project", "task", "agent"];
  const now = Date.now();

  await prisma.event.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      orgId: org.id,
      type: eventTypes[i % eventTypes.length],
      aggregateId: i % 3 === 0 ? projects[i % projects.length].id : users[i % users.length].id,
      aggregateType: aggregateTypes[i % aggregateTypes.length],
      payload: {
        sequence: i + 1,
        note: "Seeded event",
      },
      actorId: users[i % users.length].id,
      actorType: actorTypes[i % actorTypes.length],
      version: 1,
      occurredAt: new Date(now - (30 - i) * 3 * 60 * 60 * 1000),
    })),
  });

  console.log("Seed completed for Acme Corp dataset.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
