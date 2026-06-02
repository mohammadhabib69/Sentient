/**
 * End-to-end tests: Search.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { prisma } from "../../../config/prisma.js";
import { Plan, UserRole } from "@prisma/client";

describe("Search E2E", () => {
  const testEmail = `search-e2e-${Date.now()}@example.com`;
  const testPassword = "SecurePass123!";

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

  it("bootstrap", async () => {
    const res = await request(app)
      .post("/v1/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
        name: "Search User",
        orgName: "Search Org",
      });
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
      data: { plan: Plan.PRO, slug: `search-${Date.now()}` },
    });
    const reLogin = await request(app)
      .post("/v1/auth/login")
      .send({ email: testEmail, password: testPassword });
    const newCookies = extractCookies(reLogin);
    accessToken = newCookies.accessToken!;
    refreshToken = newCookies.refreshToken!;

    const ws = await request(app)
      .post("/v1/workspaces")
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ name: "Auth WS" });
    workspaceId = ws.body.data.workspace.id;

    const proj = await request(app)
      .post("/v1/projects")
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ workspaceId, name: "Auth project" });
    projectId = proj.body.data.project.id;

    const t = await request(app)
      .post("/v1/tasks")
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ projectId, title: "Implement login button" });
    taskId = t.body.data.task.id;
  });

  it("finds the task by partial title", async () => {
    const res = await request(app)
      .get(`/v1/search?q=login&types=task`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.tasks.find((t: any) => t.id === taskId);
    expect(found).toBeTruthy();
  });

  it("finds the project by name", async () => {
    const res = await request(app)
      .get(`/v1/search?q=Auth&types=project`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.projects.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.projects.find((p: any) => p.id === projectId);
    expect(found).toBeTruthy();
  });

  it("returns empty results for a missing term", async () => {
    const res = await request(app)
      .get(`/v1/search?q=ZZZ-no-match-12345`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.length).toBe(0);
    expect(res.body.data.projects.length).toBe(0);
  });
});
