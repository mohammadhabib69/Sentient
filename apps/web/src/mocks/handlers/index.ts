import { http, HttpResponse } from "msw";
import { MOCK_AGENTS, MOCK_PENDING_ACTIONS } from "../fixtures/agents.fixture";
import { MOCK_TASKS } from "../fixtures/tasks.fixture";
import { MOCK_EVENTS } from "../fixtures/events.fixture";
import {
  MOCK_VELOCITY_DATA,
  MOCK_AGENT_BREAKDOWN,
  MOCK_HEATMAP_DATA,
  MOCK_HEALTH_METRICS,
} from "../fixtures/analytics.fixture";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

export const handlers = [
  // ── Agents ────────────────────────────────────────────────────────
  http.get(`${API_URL}/agents`, () => {
    return HttpResponse.json({ success: true, data: MOCK_AGENTS });
  }),

  http.get(`${API_URL}/agents/actions`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let data = MOCK_PENDING_ACTIONS;
    if (status === "pending") {
      data = MOCK_PENDING_ACTIONS.filter((a) => a.status === "pending");
    }
    return HttpResponse.json({ success: true, data });
  }),

  http.post(`${API_URL}/agents/actions/:id/approve`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ success: true, data: { id, status: "approved" } });
  }),

  http.post(`${API_URL}/agents/actions/:id/reject`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ success: true, data: { id, status: "rejected" } });
  }),

  // ── Tasks ─────────────────────────────────────────────────────────
  http.get(`${API_URL}/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    let data = MOCK_TASKS;
    if (projectId) {
      data = MOCK_TASKS.filter((t) => t.projectId === projectId);
    }
    return HttpResponse.json({ success: true, data });
  }),

  http.patch(`${API_URL}/tasks/:id`, async ({ params, request }) => {
    const { id } = params;
    const updates = (await request.json()) as any;
    const task = MOCK_TASKS.find((t) => t.id === id);

    if (!task) {
      return HttpResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    return HttpResponse.json({ success: true, data: { ...task, ...updates } });
  }),

  // ── Events ────────────────────────────────────────────────────────
  http.get(`${API_URL}/events`, () => {
    return HttpResponse.json({
      success: true,
      data: MOCK_EVENTS,
      meta: { page: 1, limit: 30, total: 30 },
    });
  }),

  // ── Analytics ─────────────────────────────────────────────────────
  http.get(`${API_URL}/analytics/overview`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        velocity: MOCK_VELOCITY_DATA,
        agentBreakdown: MOCK_AGENT_BREAKDOWN,
        heatmap: MOCK_HEATMAP_DATA,
        health: MOCK_HEALTH_METRICS,
      },
    });
  }),
];
