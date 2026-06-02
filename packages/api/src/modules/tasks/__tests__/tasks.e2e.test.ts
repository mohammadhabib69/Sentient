/**
 * End-to-end tests: Tasks module.
 *
 * Flow: register → verify → re-login as ORG_ADMIN → create workspace →
 * create project → create 3 tasks → move one (kanban engine) → bulk-move
 * → add comment → list events.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { prisma } from "../../../config/prisma.js";
import { Plan, UserRole } from "@prisma/client";

describe("Tasks E2E", () => {
  const testEmail = `task-e2e-${Date.now()}@example.com`;
  const testPassword = "SecurePass123!";
  const testName = "Task E2E User";
  const orgSlug = `task-e2e-org-${Date.now()}`;

  let orgId: string;
  let userId: string;
  let accessToken: string;
  let refreshToken: string;
  let workspaceId: string;
  let projectId: string;
  const taskIds: string[] = [];

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

  it("registers + sets up workspace + project (test bootstrap)", async () => {
    const res = await request(app)
      .post("/v1/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
        name: testName,
        orgName: "Task E2E Org",
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
  });

  it("creates 3 tasks (each lands at position max+1)", async () => {
    for (const title of ["A", "B", "C"]) {
      const res = await request(app)
        .post("/v1/tasks")
        .set("Cookie", [`access_token=${accessToken}`])
        .send({ projectId, title });
      expect(res.status).toBe(201);
      expect(res.body.data.task.title).toBe(title);
      taskIds.push(res.body.data.task.id);
    }
  });

  it("lists tasks for the project", async () => {
    const res = await request(app)
      .get(`/v1/tasks?projectId=${projectId}`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.length).toBe(3);
  });

  it("moves a task across columns (TODO -> IN_PROGRESS)", async () => {
    const res = await request(app)
      .post(`/v1/tasks/${taskIds[0]}/move`)
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ status: "IN_PROGRESS", position: 0 });
    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe("IN_PROGRESS");
  });

  it("bulk-moves the remaining tasks", async () => {
    const res = await request(app)
      .post(`/v1/tasks/bulk-move`)
      .set("Cookie", [`access_token=${accessToken}`])
      .send({
        updates: [
          { id: taskIds[1], status: "DONE", position: 0 },
          { id: taskIds[2], status: "DONE", position: 1 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(2);
  });

  it("adds a comment to a task", async () => {
    const res = await request(app)
      .post(`/v1/tasks/${taskIds[0]}/comments`)
      .set("Cookie", [`access_token=${accessToken}`])
      .send({ content: "Looks good!" });
    expect(res.status).toBe(201);
    expect(res.body.data.comment.content).toBe("Looks good!");
  });

  it("lists comments for a task", async () => {
    const res = await request(app)
      .get(`/v1/tasks/${taskIds[0]}/comments`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.comments.length).toBe(1);
  });

  it("returns the task's event stream", async () => {
    const res = await request(app)
      .get(`/v1/tasks/${taskIds[0]}/events`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.events)).toBe(true);
    expect(res.body.data.events.length).toBeGreaterThan(0);
  });

  it("soft-deletes a task", async () => {
    const res = await request(app)
      .delete(`/v1/tasks/${taskIds[2]}`)
      .set("Cookie", [`access_token=${accessToken}`]);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });
});
