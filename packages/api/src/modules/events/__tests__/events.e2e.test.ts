/**
 * End-to-end tests: events stream (cross-cutting).
 *
 * Verifies that creating a workspace + project + task + assigning the
 * task produces events visible in GET /v1/events.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { prisma } from "../../../config/prisma.js";
import { Plan, UserRole } from "@prisma/client";

describe("Events E2E (cross-cutting)", () => {
  const testEmail = `event-e2e-${Date.now()}@example.com`;
  const testPassword = "SecurePass123!";
  const testName = "Event E2E User";

  let orgId: string;
  let userId: string;
  let accessToken: string;
  let refreshToken: string;
  let workspaceId: string;
  let projectId: string;
  let taskId: string;

  const extractCookies = (response: request.Response) => {
    const cookies = response.headers["set-cookie"] as unknown as string[] | undefined;
    const out: { accessToken?: string; refreshToken?: string } = {};
    if (!cookies) return out;
    cookies.forEach((cookie) => {
      if (cookie.startsWith("access_token=")) {
        out.accessToken = cookie.split(";")[0].split("=")[1];
      } else if (cookie.startsWith("refresh_token=")) {
        out.refreshToken = cookie.split(";")[0].split("=")[1];
      }
    });
    return out;
  };

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.taskComment.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.task.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.event.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.projectMember.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.project.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.workspace.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("registers + sets up + creates workspace/project/task (bootstrap)", async () => {
    const res = await request(app)
      .post("/v1/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
        name: testName,
        orgName: "Event E2E Org",
      });
    expect(res.status).toBe(201);
    const cookies = extractCookies(res);
    accessToken = cookies.accessToken!;
    refreshToken = cookies.refreshToken!;

    const user = await prisma.user.findFirst({ where: { email: testEmail } });
    userId = user!.id;
    orgId = user!.orgId;

    await prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.ORG_ADMIN, emailVerified: true },
    });
    await prisma.organization.update({
      where: { id: orgId },
      data: { plan: Plan.PRO, slug: `event-e2e-${Date.now()}` },
    });
    const reLogin = await request(app)
      .post("/v1/auth/login")
      .send({ email: testEmail, password: testPassword });
    const newCookies = extractCookies(reLogin);
    accessToken = newCookies.accessToken!;
    refreshToken = newCookies.refreshToken!;

    const wsRes = await request(app)
      .post("/v1/workspaces")
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ name: "WS" });
    workspaceId = wsRes.body.data.workspace.id;

    const projRes = await request(app)
      .post("/v1/projects")
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ workspaceId, name: "Proj" });
    projectId = projRes.body.data.project.id;

    const taskRes = await request(app)
      .post("/v1/tasks")
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ projectId, title: "T" });
    taskId = taskRes.body.data.task.id;
  });

  it("lists all events for the org", async () => {
    const res = await request(app)
      .get("/v1/events")
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.events)).toBe(true);
    const types = res.body.data.events.map((e: any) => e.type);
    expect(types).toContain("workspace.created");
    expect(types).toContain("project.created");
    expect(types).toContain("task.created");
  });

  it("filters events by aggregateId", async () => {
    const res = await request(app)
      .get(`/v1/events?aggregateId=${taskId}`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    for (const e of res.body.data.events) {
      expect(e.aggregateId).toBe(taskId);
    }
  });
});
