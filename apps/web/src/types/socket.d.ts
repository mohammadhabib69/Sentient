import type { Socket } from "socket.io-client";

/**
 * Type augmentation for the global `window.__socket` reference used by
 * `RealtimeProvider`. Allows non-React modules (e.g. `useRoom` hooks) to
 * reach the singleton without prop drilling.
 */
declare global {
  interface Window {
    __socket: Socket | undefined;
  }
}

export {};
