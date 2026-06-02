/**
 * Unit tests: event payload validation (Phase 7 §3.2).
 */
import { describe, it, expect } from "vitest";
import { validateEventPayload } from "../events.payloads.js";

describe("validateEventPayload", () => {
  it("accepts a valid task.created payload", () => {
    expect(
      validateEventPayload("task.created", {
        title: "T",
        projectId: "00000000-0000-0000-0000-000000000001",
        status: "todo",
      }),
    ).toBe(true);
  });

  it("rejects a task.created payload missing required fields", () => {
    expect(
      validateEventPayload("task.created", { title: "T" }),
    ).toBe(false);
  });

  it("accepts unknown event types (forward-compat)", () => {
    expect(validateEventPayload("future.event", { anything: true })).toBe(true);
  });

  it("accepts a task.status_changed payload", () => {
    expect(
      validateEventPayload("task.status_changed", {
        changes: { status: { from: "todo", to: "done" } },
      }),
    ).toBe(true);
  });

  it("accepts a task.moved payload", () => {
    expect(
      validateEventPayload("task.moved", {
        from: { status: "todo", position: 0 },
        to: { status: "in_progress", position: 1 },
      }),
    ).toBe(true);
  });
});
