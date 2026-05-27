"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, Users, CreditCard, Blocks, Shield, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/settings", label: "Organization", icon: Building2 },
  { href: "/settings/team", label: "Team Members", icon: Users },
  { href: "/settings/billing", label: "Billing & Plans", icon: CreditCard },
  { href: "/settings/integrations", label: "Integrations", icon: Blocks },
  { href: "/settings/security", label: "Security", icon: Shield },
  { href: "/settings/profile", label: "My Profile", icon: User },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col relative overflow-hidden pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-[var(--foreground-2)]">
          Manage your organization, team, and personal preferences.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-8 md:flex-row overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="flex shrink-0 flex-col gap-1 md:w-64">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "text-[var(--foreground-2)] hover:bg-[var(--surface-2)] hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isActive ? "text-[hsl(var(--primary))]" : "text-[var(--foreground-3)]",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
          <div className="mx-auto max-w-3xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
