"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

/**
 * PresenceAvatars — small green-dot avatars for everyone in the org
 * currently online.
 *
 * Reads the `onlineUsers` map in `useUIStore`, which the RealtimeProvider
 * keeps in sync via `presence:online/offline/heartbeat` events.
 *
 * Display: up to 4 avatars, then a "+N" overflow chip. Each avatar
 * shows a tooltip with the user's name and current page on hover.
 */
export function PresenceAvatars({ className }: { className?: string }) {
  const onlineUsers = useUIStore((s) => s.onlineUsers);
  const users = Object.values(onlineUsers);
  const visible = users.slice(0, 4);
  const overflow = Math.max(0, users.length - visible.length);

  if (users.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs text-[var(--foreground-3)]",
          className,
        )}
        title="No one else is online"
      >
        <Users className="size-3.5" />
        <span>Just you</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex -space-x-2">
        <AnimatePresence>
          {visible.map((u) => (
            <motion.div
              key={u.userId}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              title={pageLabel(u.page, u.userId)}
              className="relative"
            >
              <Avatar userId={u.userId} />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--surface-1)] bg-emerald-500" />
            </motion.div>
          ))}
        </AnimatePresence>
        {overflow > 0 && (
          <div
            className="flex size-7 items-center justify-center rounded-full border-2 border-[var(--surface-1)] bg-[var(--surface-2)] text-[10px] font-semibold text-[var(--foreground-2)]"
            title={`${overflow} more online`}
          >
            +{overflow}
          </div>
        )}
      </div>
      <span className="ml-1 text-xs text-[var(--foreground-3)]">
        {users.length} online
      </span>
    </div>
  );
}

function pageLabel(page: string, _userId: string): string {
  if (!page || page === "/") return "Online";
  return `On ${page}`;
}

function Avatar({ userId }: { userId: string }) {
  // The presence payload only carries userId + page. We keep this
  // intentional: a fuller /v1/presence hydration on first paint fills
  // in names, but for the live socket-driven updates we only have the
  // id. Render a deterministic color from the id so two users with
  // the same id always look the same.
  const initials = userId.slice(0, 2).toUpperCase();
  return (
    <div
      className="flex size-7 items-center justify-center rounded-full border-2 border-[var(--surface-1)] bg-[var(--surface-3)] text-[10px] font-semibold text-foreground"
      style={{ background: tintFor(userId) }}
    >
      {initials}
    </div>
  );
}

function tintFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return `hsl(${hue}, 45%, 30%)`;
}
