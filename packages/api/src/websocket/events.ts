/**
 * WebSocket emit stub.
 *
 * Phase 5 calls this from every CRUD service so that the WebSocket wiring
 * is already in place. Phase 8 will replace the body with a real Socket.io
 * emit (`io.to(`org:${orgId}`).emit(event, data)`).
 *
 * For now we just log so the call sites are exercised in dev and tests can
 * mock the function.
 */

export function emitToOrg(orgId: string, event: string, data: unknown): void {
  if (process.env.NODE_ENV === "development") {
    // Keep it a single line so it doesn't blow up the test output.
    console.log(`[WS Stub] Emit to org ${orgId}: ${event}`, data);
  }
  // Phase 8 will wire Socket.io
}
