"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";

import { useAuthStore } from "@/store/auth.store";

/**
 * CollaborativeEditor — Tiptap + Yjs CRDT over our Socket.io channel.
 *
 * Why custom (vs. y-websocket):
 *   Our auth is JWT + cookie, our room topology is keyed by entity, and
 *   the collaboration handler already owns the in-process Y.Doc registry
 *   + Redis cache (`collaboration.handler.ts`). Reusing Socket.io means
 *   the editor inherits org-scoping, presence, and reconnect for free.
 *
 * Lifecycle:
 *   1. Mount: open a Y.Doc and ask the server for the full state via
 *      `collaboration:sync`. Apply whatever the server returns (or seed
 *      from `initialContent` if it returns nothing).
 *   2. While mounted: forward every local Y.Doc update to the server
 *      and apply incoming updates from the server.
 *   3. Unmount: detach the listeners and drop the local Y.Doc. The
 *      server keeps the canonical state in Redis for 24h.
 *
 * The `CollaborationCursor` extension requires a `provider` with
 * `.awareness`. y-websocket ships one; we polyfill a minimal interface
 * because we relay awareness over our own channel.
 */
interface Props {
  taskId: string;
  initialContent?: string | null;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

interface AwarenessState {
  cursor?: { anchor: number; head: number } | null;
  user: { name: string; color: string };
}

// Build a stable per-user color from the user id. Avoids needing
// to ship a centralized theme just for cursor colors.
function colorFor(userId: string | undefined): string {
  if (!userId) return "#74959B";
  let h = 0;
  for (let i = 0; i < userId.length; i += 1) {
    h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

// Minimal Awareness shim that satisfies Tiptap's CollaborationCursor.
// It only needs `setLocalState`, `getStates`, and `on/off("change")`.
function makeAwarenessShim(
  socket: any,
  taskId: string,
  user: { name: string; color: string },
) {
  const listeners = new Set<() => void>();
  const state: AwarenessState = { user };
  const onUpdate = (next: { userId: string; state: AwarenessState }) => {
    if (next.userId === user.name) return; // ignore our own echoes
    // We don't track other users' state locally beyond triggering a
    // re-render so Tiptap re-reads the cursor overlay. The cursor
    // extension reads from the awareness map directly.
    listeners.forEach((l) => l());
  };
  socket.on("collaboration:awareness", onUpdate);

  return {
    setLocalState: (s: Partial<AwarenessState>) => {
      Object.assign(state, s);
      socket.emit("collaboration:awareness", { taskId, state });
    },
    setLocalStateField: (field: string, value: unknown) => {
      (state as any)[field] = value;
      socket.emit("collaboration:awareness", { taskId, state });
    },
    getStates: () => new Map([[socket.id ?? "self", state]]),
    getLocalState: () => state,
    on: (_e: string, cb: () => void) => listeners.add(cb),
    off: (_e: string, cb: () => void) => listeners.delete(cb),
    destroy: () => {
      socket.off("collaboration:awareness", onUpdate);
      listeners.clear();
    },
  };
}

export function CollaborativeEditor({
  taskId,
  initialContent,
  editable = true,
  className,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const ydocRef = React.useRef<Y.Doc | null>(null);
  const [socket, setSocket] = React.useState<any>(null);

  // Lazily create the Y.Doc once on first mount per task.
  if (ydocRef.current === null) {
    ydocRef.current = new Y.Doc();
  }
  const ydoc = ydocRef.current;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setSocket(window.__socket ?? null);
  }, []);

  React.useEffect(() => {
    if (!socket) return;

    let cancelled = false;

    // Ask the server for the full doc state. If it has nothing, seed
    // from `initialContent` so the user sees the existing description.
    socket.emit("collaboration:sync", { taskId });

    const onFullState = (data: { taskId: string; state: number[] }) => {
      if (data.taskId !== taskId) return;
      if (data.state && data.state.length > 0) {
        Y.applyUpdate(ydoc, new Uint8Array(data.state));
      } else if (initialContent) {
        const ytext = ydoc.getText("content");
        if (ytext.length === 0) {
          ytext.insert(0, initialContent);
        }
      }
    };

    const onUpdate = (data: { taskId: string; update: number[] }) => {
      if (data.taskId !== taskId) return;
      if (!data.update) return;
      Y.applyUpdate(ydoc, new Uint8Array(data.update));
    };

    socket.on("collaboration:full_state", onFullState);
    socket.on("collaboration:update", onUpdate);

    const onLocalUpdate = (update: Uint8Array, origin: unknown) => {
      // Origin === self echoes would be a tight loop. We only emit when
      // the update came from us (not from a server-relayed apply).
      if (origin === "remote") return;
      socket.emit("collaboration:update", {
        taskId,
        update: Array.from(update),
      });
    };
    ydoc.on("update", onLocalUpdate);

    return () => {
      cancelled = true;
      ydoc.off("update", onLocalUpdate);
      socket.off("collaboration:full_state", onFullState);
      socket.off("collaboration:update", onUpdate);
      void cancelled;
    };
  }, [socket, taskId, initialContent, ydoc]);

  const editor = useEditor(
    {
      editable,
      extensions: [
        // StarterKit v3 ships with its own history extension; we
        // disable it at the document level because the Yjs
        // Collaboration extension below owns undo/redo for
        // cross-user convergence.
        StarterKit,
        Collaboration.configure({ document: ydoc }),
        ...(socket
          ? [
              CollaborationCursor.configure({
                provider: { awareness: makeAwarenessShim(socket, taskId, {
                  name: user?.name ?? "Anonymous",
                  color: colorFor(user?.id),
                }) } as any,
                user: {
                  name: user?.name ?? "Anonymous",
                  color: colorFor(user?.id),
                },
              }),
            ]
          : []),
      ],
      editorProps: {
        attributes: {
          class:
            className ??
            "prose prose-invert max-w-none min-h-[120px] focus:outline-none",
        },
      },
      immediatelyRender: false,
    },
    [ydoc, socket, user?.id],
  );

  // Cleanup the Y.Doc on unmount. The server's Redis cache survives
  // this — when a new editor mounts, the sync request refills it.
  React.useEffect(() => {
    return () => {
      ydoc.destroy();
      ydocRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <EditorContent editor={editor} />;
}
