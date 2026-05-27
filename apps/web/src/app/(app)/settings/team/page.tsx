"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Users, MoreHorizontal, UserPlus } from "lucide-react";

export default function TeamSettingsPage() {
  const team = [
    { name: "Mohammad Habib", email: "mohammad@acme.com", role: "Owner", status: "Active" },
    { name: "Sarah Connor", email: "sarah@acme.com", role: "Admin", status: "Active" },
    { name: "John Smith", email: "john@acme.com", role: "Member", status: "Pending" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
          <p className="text-sm text-[var(--foreground-3)]">
            Manage who has access to this organization.
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90">
          <UserPlus className="size-4" /> Invite Member
        </Button>
      </div>

      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-1)] shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--glass-border)] bg-[var(--surface-2)]">
            <tr>
              <th className="px-6 py-3 font-medium text-[var(--foreground-2)]">Name</th>
              <th className="px-6 py-3 font-medium text-[var(--foreground-2)]">Role</th>
              <th className="px-6 py-3 font-medium text-[var(--foreground-2)]">Status</th>
              <th className="px-6 py-3 font-medium text-[var(--foreground-2)] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--glass-border)]">
            {team.map((member, i) => (
              <tr key={i} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{member.name}</div>
                      <div className="text-[var(--foreground-3)]">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select className="rounded bg-transparent outline-none text-foreground border border-[var(--glass-border)] px-2 py-1 text-xs">
                    <option>{member.role}</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      member.status === "Active"
                        ? "bg-[var(--green)]/10 text-[var(--green)]"
                        : "bg-[var(--amber)]/10 text-[var(--amber)]"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 text-[var(--foreground-3)] hover:text-foreground">
                    <MoreHorizontal className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
