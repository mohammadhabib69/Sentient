/**
 * End-to-end tests: Projects module.
 *
 * Flow: register → verify → re-login as ORG_ADMIN → create workspace →
 * create project → list → get → get stats → update → soft delete.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { prisma } from "../../../config/prisma.js";
import { Plan, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

describe("Projects E2E", () => {
  const testEmail = `proj-e2e-${Date.now()}@example.com`;
  const testPassword = "SecurePass123!";
  const testName = "Proj E2E User";
  const orgSlug = `proj-e2e-org-${Date.now()}`;

  let orgId: string;
  let userId: string;
  let accessToken: string;
  let refreshToken: string;
  let workspaceId: string;
  let projectId: string;

  const extractCookies = (
    response: request.Response,
  ): { accessToken?: string; refreshToken?: string } => {
    const cookies = response.headers["set-cookie"] as unknown as string[] | undefined;
    const result: { accessToken?: string; refreshToken?: string } = {};
    if (!cookies) return result;
    cookies.forEach((cookie) => {
      if (cookie.startsWith("access_token=")) {
        result.accessToken = cookie.split(";")[0].split("=")[1];
      } else if (cookie.startsWith("refresh_token=")) {
        result.refreshToken = cookie.split(";")[0].split("=")[1];
      }
    });
    return result;
  };

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.projectMember.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.project.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.workspace.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("registers + sets up a workspace (test bootstrap)", async () => {
    const res = await request(app)
      .post("/v1/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
        name: testName,
        orgName: "Proj E2E Org",
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
      data: { plan: Plan.PRO, slug: orgSlug },
    });

    // Re-login so the token reflects ORG_ADMIN.
    const reLogin = await request(app)
      .post("/v1/auth/login")
      .send({ email: testEmail, password: testPassword });
    const newCookies = extractCookies(reLogin);
    accessToken = newCookies.accessToken!;
    refreshToken = newCookies.refreshToken!;

    // Create a workspace to host the project.
    const wsRes = await request(app)
      .post("/v1/workspaces")
      .set("Cookie", [`access_token=${accessToken}`, `refresh_token=${refreshToken}`])
      .send({ name: "Acme WS" });
    expect(wsRes.status).toBe(201);
    workspaceId = wsRes.body.data.workspace.id;
  });

  it("creates a project", async () => {
    const res = await request(app)
      .post("/v1/projects")
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ workspaceId, name: "Apollo" });
    expect(res.status).toBe(201);
    expect(res.body.data.project.name).toBe("Apollo");
    expect(res.body.data.project.workspaceId).toBe(workspaceId);
    expect(res.body.data.project.memberCount).toBe(1);
    projectId = res.body.data.project.id;
  });

  it("lists projects for the org", async () => {
    const res = await request(app)
      .get("/v1/projects")
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.projects.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.projects.find((p: any) => p.id === projectId)).toBeTruthy();
  });

  it("gets a single project by id", async () => {
    const res = await request(app)
      .get(`/v1/projects/${projectId}`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.project.id).toBe(projectId);
  });

  it("gets project stats", async () => {
    const res = await request(app)
      .get(`/v1/projects/${projectId}/stats`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalTasks).toBe(0);
    expect(res.body.data.stats.healthScore).toBe(100);
  });

  it("updates a project", async () => {
    const res = await request(app)
      .patch(`/v1/projects/${projectId}`)
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ name: "Apollo Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.project.name).toBe("Apollo Renamed");
  });

  it("soft-deletes a project", async () => {
    const res = await request(app)
      .delete(`/v1/projects/${projectId}`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });

  it("returns 404 after soft delete", async () => {
    const res = await request(app)
      .get(`/v1/projects/${projectId}`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(404);
  });
});
