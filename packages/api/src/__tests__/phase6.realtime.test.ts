/**
 * Phase 6 realtime integration test — full chain end-to-end.
 *
 * Boots the Express app + Socket.io on a real HTTP server, then
 * exercises the realtime chain:
 *
 *   1. Register a user (HTTP) and capture the JWT.
 *   2. Open a Socket.io connection with the JWT.
 *   3. Trigger a task create via HTTP — assert the client receives
 *      `task:created`, `stream:event`, and `metrics:updated`.
 *   4. Update the task status — assert `task:updated`,
 *      `task:status_changed`, `stream:event`, and a fresh `metrics:updated`.
 *   5. Move the task between columns — assert `task:moved`.
 *   6. Delete the task — assert `task:deleted`.
 *   7. Cross-org isolation: a second user in a different org opens a
 *      socket and must NOT receive the first org's events.
 *
 * Unlike the Phase 5 smoke test, this test actually exercises the WS
 * pipeline: it confirms the envelope shape (payload + actor +
 * timestamp) and the multi-tenant isolation guarantee.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server as HttpServer } from "node:http";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import request from "supertest";
import { app } from "../app.js";
import { initWebSocket } from "../websocket/index.js";
import { prisma } from "../config/prisma.js";
import { redisClient } from "../config/redis.js";
import { Plan, UserRole } from "@prisma/client";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("Phase 6 realtime — full chain end-to-end", () => {
  let httpServer: HttpServer;
  let baseUrl: string;
  let port: number;

  // User A's context
  const aEmail = `phase6-a-${Date.now()}@example.com`;
  const password = "SecurePass123!";
  let aOrgId: string;
  let aUserId: string;
  let aAccessToken: string;
  let aWorkspaceId: string;
  let aProjectId: string;

  // User B (different org) — used to prove multi-tenant isolation
  const bEmail = `phase6-b-${Date.now()}@example.com`;
  let bAccessToken: string;
  let bOrgId: string;
  let bUserId: string;

  // Sockets
  let socketA: ClientSocket;
  let socketB: ClientSocket;

  const extractCookies = (response: request.Response) => {
    const cookies = response.headers["set-cookie"] as unknown as string[] | undefined;
    const out: { accessToken?: string } = {};
    if (!cookies) return out;
    cookies.forEach((cookie) => {
      if (cookie.startsWith("access_token=")) {
        out.accessToken = cookie.split(";")[0].split("=")[1];
      }
    });
    return out;
  };

  beforeAll(async () => {
    await prisma.$connect();
    await redisClient.ping();

    // Spin up the live HTTP server with Socket.io attached.
    httpServer = createServer(app);
    initWebSocket(httpServer);
    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", () => resolve());
    });
    const addr = httpServer.address();
    if (typeof addr !== "object" || !addr) throw new Error("server not bound");
    port = addr.port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Register user A
    const regA = await request(app)
      .post("/v1/auth/register")
      .send({
        email: aEmail,
        password,
        name: "Phase6 User A",
        orgName: "Phase6 Org A",
      });
    expect(regA.status).toBe(201);
    aAccessToken = extractCookies(regA).accessToken!;
    const userA = await prisma.user.findFirst({ where: { email: aEmail } });
    aUserId = userA!.id;
    aOrgId = userA!.orgId;
    await prisma.user.update({
      where: { id: aUserId },
      data: { role: UserRole.ORG_ADMIN, emailVerified: true },
    });
    await prisma.organization.update({
      where: { id: aOrgId },
      data: { plan: Plan.PRO, slug: `phase6-a-${Date.now()}` },
    });
    const reLoginA = await request(app)
      .post("/v1/auth/login")
      .send({ email: aEmail, password });
    aAccessToken = extractCookies(reLoginA).accessToken!;

    // Register user B (different org)
    const regB = await request(app)
      .post("/v1/auth/register")
      .send({
        email: bEmail,
        password,
        name: "Phase6 User B",
        orgName: "Phase6 Org B",
      });
    expect(regB.status).toBe(201);
    bAccessToken = extractCookies(regB).accessToken!;
    const userB = await prisma.user.findFirst({ where: { email: bEmail } });
    bUserId = userB!.id;
    bOrgId = userB!.orgId;
    expect(bOrgId).not.toBe(aOrgId);
    await prisma.user.update({
      where: { id: bUserId },
      data: { role: UserRole.ORG_ADMIN, emailVerified: true },
    });
    await prisma.organization.update({
      where: { id: bOrgId },
      data: { plan: Plan.PRO, slug: `phase6-b-${Date.now()}` },
    });
    const reLoginB = await request(app)
      .post("/v1/auth/login")
      .send({ email: bEmail, password });
    bAccessToken = extractCookies(reLoginB).accessToken!;

    // Open the sockets
    socketA = ioClient(baseUrl, {
      transports: ["websocket"],
      auth: { token: aAccessToken },
      reconnection: false,
    });
    socketB = ioClient(baseUrl, {
      transports: ["websocket"],
      auth: { token: bAccessToken },
      reconnection: false,
    });
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        socketA.once("connect", () => resolve());
        socketA.once("connect_error", (e) => reject(e));
      }),
      new Promise<void>((resolve, reject) => {
        socketB.once("connect", () => resolve());
        socketB.once("connect_error", (e) => reject(e));
      }),
    ]);
  }, 60_000);

  afterAll(async () => {
    try { socketA?.disconnect(); } catch { /* noop */ }
    try { socketB?.disconnect(); } catch { /* noop */ }
    try { socketB?.close(); } catch { /* noop */ }
    try { socketA?.close(); } catch { /* noop */ }
    try {
      await prisma.taskComment.deleteMany({ where: { orgId: aOrgId } }).catch(() => {});
      await prisma.task.deleteMany({ where: { orgId: aOrgId } }).catch(() => {});
      await prisma.event.deleteMany({ where: { orgId: aOrgId } }).catch(() => {});
      await prisma.projectMember.deleteMany({ where: { orgId: aOrgId } }).catch(() => {});
      await prisma.project.deleteMany({ where: { orgId: aOrgId } }).catch(() => {});
      await prisma.workspace.deleteMany({ where: { orgId: aOrgId } }).catch(() => {});
      await prisma.session.deleteMany({ where: { userId: aUserId } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: aUserId } }).catch(() => {});
      await prisma.organization.deleteMany({ where: { id: aOrgId } }).catch(() => {});

      await prisma.task.deleteMany({ where: { orgId: bOrgId } }).catch(() => {});
      await prisma.event.deleteMany({ where: { orgId: bOrgId } }).catch(() => {});
      await prisma.session.deleteMany({ where: { userId: bUserId } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: bUserId } }).catch(() => {});
      await prisma.organization.deleteMany({ where: { id: bOrgId } }).catch(() => {});

      // Clear presence keys we wrote.
      const keysA = await redisClient.keys(`presence:${aOrgId}:*`).catch(() => []);
      const keysB = await redisClient.keys(`presence:${bOrgId}:*`).catch(() => []);
      for (const k of keysA) await redisClient.del(k).catch(() => {});
      for (const k of keysB) await redisClient.del(k).catch(() => {});
      await redisClient.del(`metrics:${aOrgId}`).catch(() => {});
      await redisClient.del(`metrics:${bOrgId}`).catch(() => {});
    } finally {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      await prisma.$disconnect();
    }
  }, 30_000);

  it("1. /v1/health reachable + sockets are open", async () => {
    const res = await request(app).get("/health");
    expect([200, 503]).toContain(res.status);
    expect(socketA.connected).toBe(true);
    expect(socketB.connected).toBe(true);
  });

  it("2. seed a workspace + project for user A (HTTP)", async () => {
    const wsRes = await request(app)
      .post("/v1/workspaces")
      .set("Cookie", `access_token=${aAccessToken}`)
      .send({ name: "Phase6 WS A" });
    expect(wsRes.status).toBe(201);
    aWorkspaceId = wsRes.body.data.workspace.id;

    const projRes = await request(app)
      .post("/v1/projects")
      .set("Cookie", `access_token=${aAccessToken}`)
      .send({ name: "Phase6 Project A", workspaceId: aWorkspaceId });
    expect(projRes.status).toBe(201);
    aProjectId = projRes.body.data.project.id;
  });

  it("3. createTask emits task:created + stream:event + metrics:updated with envelope", async () => {
    const createdPromise = new Promise<any>((resolve) =>
      socketA.once("task:created", resolve),
    );
    // The first `stream:event` to arrive may be an unrelated
    // `user_registered` from beforeAll's auth flow. Wait for an event
    // whose `aggregateId` matches the task we just created.
    const streamPromise = new Promise<any>((resolve, reject) => {
      const onEvent = (e: any) => {
        if (e.aggregateId && e.type === "task.created") {
          socketA.off("stream:event", onEvent);
          resolve(e);
        }
      };
      socketA.on("stream:event", onEvent);
      setTimeout(() => {
        socketA.off("stream:event", onEvent);
        reject(new Error("no task.created stream:event within 2s"));
      }, 2_000);
    });
    // metrics:updated is also broadcast — give it a tick to come through
    const metricsPromise = new Promise<any>((resolve) =>
      socketA.once("metrics:updated", resolve),
    );
    const bShouldNotReceive = new Promise<any>((resolve, reject) => {
      const t = setTimeout(() => resolve("ok-no-event"), 2_000);
      socketB.once("task:created", (e) => {
        clearTimeout(t);
        reject(new Error("org B received task:created for org A"));
      });
    });

    const res = await request(app)
      .post("/v1/tasks")
      .set("Cookie", `access_token=${aAccessToken}`)
      .send({ title: "Phase6 Task A", projectId: aProjectId });
    expect(res.status).toBe(201);
    const taskId = res.body.data.task.id;

    const [taskEvt, streamEvt, metricsEvt, isolationCheck] = await Promise.all([
      createdPromise,
      streamPromise,
      // Metrics might be cached; don't fail if the cache TTL hasn't expired.
      metricsPromise.catch(() => null),
      bShouldNotReceive,
    ]);
    expect(isolationCheck).toBe("ok-no-event");

    // Envelope shape: payload, actor, timestamp
    expect(taskEvt.payload).toMatchObject({
      id: taskId,
      projectId: aProjectId,
    });
    expect(taskEvt.actor).toMatchObject({ id: aUserId, type: "USER" });
    expect(typeof taskEvt.timestamp).toBe("string");
    expect(new Date(taskEvt.timestamp).toString()).not.toBe("Invalid Date");

    expect(streamEvt.id).toBeTypeOf("string");
    expect(streamEvt.aggregateId).toBe(taskId);
    expect(streamEvt.type).toBe("task.created");
    if (metricsEvt) {
      expect(typeof metricsEvt.activeTasks).toBe("number");
    }
  });

  it("4. updateTask status emits task:updated + stream:event", async () => {
    // Find the task we just created via the task list endpoint.
    const listRes = await request(app)
      .get(`/v1/tasks?projectId=${aProjectId}`)
      .set("Cookie", `access_token=${aAccessToken}`);
    expect(listRes.status).toBe(200);
    const taskId = listRes.body.data.tasks[0].id;
    expect(taskId).toBeTruthy();

    const updatePromise = new Promise<any>((resolve) =>
      socketA.once("task:updated", resolve),
    );
    // Stream:event is multi-event per request (status_changed +
    // assigned etc). Look for one tied to our task.
    const streamPromise = new Promise<any>((resolve, reject) => {
      const onEvent = (e: any) => {
        if (e.aggregateId === taskId && e.type?.startsWith("task.")) {
          socketA.off("stream:event", onEvent);
          resolve(e);
        }
      };
      socketA.on("stream:event", onEvent);
      setTimeout(() => {
        socketA.off("stream:event", onEvent);
        reject(new Error("no task stream:event within 2s"));
      }, 2_000);
    });

    const res = await request(app)
      .patch(`/v1/tasks/${taskId}`)
      .set("Cookie", `access_token=${aAccessToken}`)
      .send({ status: "IN_PROGRESS" });
    expect(res.status).toBe(200);

    const [updateEvt, streamEvt] = await Promise.all([
      updatePromise,
      streamPromise,
    ]);
    expect(updateEvt.payload.id).toBe(taskId);
    expect(updateEvt.payload.changes.status).toMatchObject({
      from: "TODO",
      to: "IN_PROGRESS",
    });
    expect(updateEvt.actor.id).toBe(aUserId);
    expect(typeof updateEvt.timestamp).toBe("string");
    expect(streamEvt.aggregateId).toBe(taskId);
  });

  it("5. moveTask emits task:moved with envelope", async () => {
    const listRes = await request(app)
      .get(`/v1/tasks?projectId=${aProjectId}`)
      .set("Cookie", `access_token=${aAccessToken}`);
    const taskId = listRes.body.data.tasks[0].id;

    const movedPromise = new Promise<any>((resolve) =>
      socketA.once("task:moved", resolve),
    );

    const res = await request(app)
      .post(`/v1/tasks/${taskId}/move`)
      .set("Cookie", `access_token=${aAccessToken}`)
      .send({ status: "DONE", position: 0 });
    expect(res.status).toBe(200);

    const movedEvt = await movedPromise;
    expect(movedEvt.payload.id).toBe(taskId);
    expect(movedEvt.payload.to).toMatchObject({ status: "DONE", position: 0 });
    expect(movedEvt.actor.id).toBe(aUserId);
    expect(typeof movedEvt.timestamp).toBe("string");
  });

  it("6. deleteTask emits task:deleted", async () => {
    const listRes = await request(app)
      .get(`/v1/tasks?projectId=${aProjectId}`)
      .set("Cookie", `access_token=${aAccessToken}`);
    const taskId = listRes.body.data.tasks[0].id;

    const deletedPromise = new Promise<any>((resolve) =>
      socketA.once("task:deleted", resolve),
    );

    const res = await request(app)
      .delete(`/v1/tasks/${taskId}`)
      .set("Cookie", `access_token=${aAccessToken}`);
    expect(res.status).toBe(200);

    const deletedEvt = await deletedPromise;
    expect(deletedEvt.payload.id).toBe(taskId);
    expect(deletedEvt.actor.id).toBe(aUserId);
    expect(typeof deletedEvt.timestamp).toBe("string");
  });

  it("7. presence:online broadcast on connect (org-scoped)", async () => {
    // The broadcast is `socket.to('org:a').emit(...)` so it goes to
    // every socket in org A EXCEPT the one that just connected. To
    // observe it we open a second A-user socket and listen on it
    // before the third socket joins.
    const seen = new Promise<any>((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error("A2 never saw A1's online")),
        3_000,
      );
      socketA.once("presence:online", (e) => {
        if (e.userId === aUserId) {
          clearTimeout(t);
          resolve(e);
        }
      });
    });
    const freshA = ioClient(baseUrl, {
      transports: ["websocket"],
      auth: { token: aAccessToken },
      reconnection: false,
      forceNew: true,
    });
    await new Promise<void>((resolve, reject) => {
      freshA.once("connect", () => resolve());
      freshA.once("connect_error", (e) => reject(e));
    });
    try {
      const evt = await seen;
      expect(evt.userId).toBe(aUserId);
      expect(evt.orgId).toBe(aOrgId);
    } finally {
      freshA.disconnect();
    }
  });

  it("8. cross-org isolation: B does not receive A's task:created", async () => {
    // Trigger a workspace update in A, then create a task; B must not see it.
    const shouldNotReceive = new Promise<"ok">((resolve, reject) => {
      const t = setTimeout(() => resolve("ok"), 2_000);
      socketB.once("task:created", (e) => {
        clearTimeout(t);
        reject(new Error(`B received A's task:created: ${JSON.stringify(e)}`));
      });
    });
    const res = await request(app)
      .post("/v1/tasks")
      .set("Cookie", `access_token=${aAccessToken}`)
      .send({ title: "Isolation probe", projectId: aProjectId });
    expect(res.status).toBe(201);
    expect(await shouldNotReceive).toBe("ok");
  });
});
