/**
 * End-to-end tests: Workspaces module.
 *
 * Covers the full happy path:
 *   register → verify email → login → create → list → get → update → soft delete
 *
 * Uses the real Postgres + Redis stack (the e2e env). Cleans up any rows
 * it creates so the suite is idempotent.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { prisma } from "../../../config/prisma.js";
import { Plan, UserRole } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";

describe("Workspaces E2E", () => {
  const testEmail = `ws-e2e-${Date.now()}@example.com`;
  const testPassword = "SecurePass123!";
  const testName = "WS E2E User";
  const orgSlug = `ws-e2e-org-${Date.now()}`;

  let orgId: string;
  let userId: string;
  let accessToken: string;
  let refreshToken: string;
  let createdWorkspaceId: string;

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
    // Best-effort cleanup; don't fail the suite if a row was already gone.
    await prisma.event.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.workspace.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("registers a new user + org (test setup)", async () => {
    const res = await request(app)
      .post("/v1/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
        name: testName,
        orgName: "WS E2E Org",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);

    const cookies = extractCookies(res);
    accessToken = cookies.accessToken!;
    refreshToken = cookies.refreshToken!;
    expect(accessToken).toBeDefined();

    const user = await prisma.user.findFirst({ where: { email: testEmail } });
    expect(user).toBeTruthy();
    userId = user!.id;
    orgId = user!.orgId;

    // Verify email so future flows that check it pass.
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 12);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken: tokenHash, emailVerifyExpiry: expiry, emailVerified: true },
    });

    // Bump role so workspace write endpoints are permitted.
    await prisma.user.update({ where: { id: userId }, data: { role: UserRole.ORG_ADMIN } });
    await prisma.organization.update({
      where: { id: orgId },
      data: { plan: Plan.PRO, slug: orgSlug },
    });

    // Re-login so the access token reflects the new ORG_ADMIN role.
    const reLogin = await request(app)
      .post("/v1/auth/login")
      .send({ email: testEmail, password: testPassword });
    const newCookies = extractCookies(reLogin);
    accessToken = newCookies.accessToken!;
    refreshToken = newCookies.refreshToken!;
  });

  it("creates a workspace", async () => {
    const res = await request(app)
      .post("/v1/workspaces")
      .set("Cookie", [`access_token=${accessToken}`, `refresh_token=${refreshToken}`])
      .send({ name: "Acme HQ", description: "Main workspace" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.workspace.name).toBe("Acme HQ");
    expect(res.body.data.workspace.orgId).toBe(orgId);
    createdWorkspaceId = res.body.data.workspace.id;
  });

  it("lists workspaces for the org", async () => {
    const res = await request(app)
      .get("/v1/workspaces")
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.workspaces)).toBe(true);
    expect(res.body.data.workspaces.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.workspaces.find((w: any) => w.id === createdWorkspaceId)).toBeTruthy();
  });

  it("gets a single workspace by id", async () => {
    const res = await request(app)
      .get(`/v1/workspaces/${createdWorkspaceId}`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.workspace.id).toBe(createdWorkspaceId);
  });

  it("updates a workspace", async () => {
    const res = await request(app)
      .patch(`/v1/workspaces/${createdWorkspaceId}`)
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ name: "Acme HQ Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.workspace.name).toBe("Acme HQ Renamed");
  });

  it("soft-deletes a workspace with no active projects", async () => {
    const res = await request(app)
      .delete(`/v1/workspaces/${createdWorkspaceId}`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });

  it("returns 404 after soft delete", async () => {
    const res = await request(app)
      .get(`/v1/workspaces/${createdWorkspaceId}`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(404);
  });
});
