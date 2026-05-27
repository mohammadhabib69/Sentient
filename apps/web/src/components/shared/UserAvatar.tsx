"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-12 text-sm",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserAvatar({ name, avatarUrl, size = "md", className }: UserAvatarProps) {
  return (
    <Avatar className={cn(SIZES[size], "border border-[var(--glass-border)]", className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback className="bg-[hsl(var(--primary))]/10 font-semibold text-[hsl(var(--primary))]">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
