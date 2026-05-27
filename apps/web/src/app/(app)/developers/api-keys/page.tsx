"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Key, Copy, Trash2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  environment: "Live" | "Test";
  created: string;
  lastUsed: string;
  status: "Active" | "Revoked";
}

export default function ApiKeysPage() {
  const [modalOpen, setModalOpen] = React.useState(false);

  // Local list state
  const [keys, setKeys] = React.useState<ApiKey[]>([
    {
      id: "key_1",
      name: "Production Key",
      environment: "Live",
      created: "Jan 15, 2026",
      lastUsed: "2m ago",
      status: "Active",
    },
    {
      id: "key_2",
      name: "Development Key",
      environment: "Test",
      created: "Mar 3, 2026",
      lastUsed: "Never",
      status: "Active",
    },
    {
      id: "key_3",
      name: "Old Staging Key",
      environment: "Test",
      created: "Sep 20, 2025",
      lastUsed: "30d ago",
      status: "Revoked",
    },
  ]);

  // New key form states
  const [keyName, setKeyName] = React.useState("");
  const [env, setEnv] = React.useState<"Live" | "Test">("Live");

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText("sk_" + env.toLowerCase() + "_57af...92da");
    toast.success(`Copied secret credentials for ${name}`);
  };

  const handleRevoke = (id: string, name: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "Revoked" } : k)));
    toast.warning(`API Key "${name}" has been revoked.`);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const newKey: ApiKey = {
      id: "key_" + Date.now(),
      name: keyName,
      environment: env,
      created: new Date().toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      lastUsed: "Never",
      status: "Active",
    };

    setKeys([newKey, ...keys]);
    setKeyName("");
    setModalOpen(false);
    toast.success(`Created API Key "${newKey.name}" successfully.`);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">API Credentials</h2>
          <p className="text-xs text-[var(--foreground-2)]">
            Use keys to authenticate automated scripts with Sentient pipelines
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary hover:brightness-110 text-white shadow-sm transition-all"
        >
          <Plus className="size-4" /> Create New Key
        </button>
      </div>

      {/* Keys Table Card */}
      <div className="glass-panel rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[var(--surface-2)] border-b border-[var(--glass-border)] text-[var(--foreground-3)]">
            <tr>
              <th className="px-5 py-3">NAME</th>
              <th className="px-5 py-3">ENVIRONMENT</th>
              <th className="px-5 py-3">CREATED</th>
              <th className="px-5 py-3">LAST USED</th>
              <th className="px-5 py-3">STATUS</th>
              <th className="px-5 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--glass-border)]">
            {keys.map((key) => {
              const isActive = key.status === "Active";

              return (
                <tr
                  key={key.id}
                  className={cn(
                    "hover:bg-[var(--surface-2)]/30 transition-colors",
                    !isActive ? "opacity-60" : "",
                  )}
                >
                  {/* Name */}
                  <td className="px-5 py-4 font-sans font-bold text-foreground">
                    <div className="flex items-center gap-2.5">
                      <Key className="size-4 text-[var(--foreground-3)]" />
                      <span
                        className={cn(!isActive ? "line-through text-[var(--foreground-3)]" : "")}
                      >
                        {key.name}
                      </span>
                    </div>
                  </td>

                  {/* Environment Badge */}
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        key.environment === "Live"
                          ? "bg-forest-green/10 text-forest-green"
                          : "bg-amber/10 text-amber",
                      )}
                    >
                      {key.environment}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="px-5 py-4 text-[var(--foreground-2)]">{key.created}</td>

                  {/* Last Used */}
                  <td className="px-5 py-4 text-[var(--foreground-2)]">{key.lastUsed}</td>

                  {/* Status Dot */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          isActive ? "bg-forest-green" : "bg-red",
                        )}
                      />
                      <span className="capitalize">{key.status}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopy(key.name)}
                        disabled={!isActive}
                        className="p-1 text-[var(--foreground-3)] hover:text-foreground hover:bg-[var(--surface-2)] rounded disabled:opacity-30 disabled:pointer-events-none"
                        title="Copy Key Credentials"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        onClick={() => handleRevoke(key.id, key.name)}
                        disabled={!isActive}
                        className="p-1 text-[var(--foreground-3)] hover:text-red hover:bg-[var(--surface-2)] rounded disabled:opacity-30 disabled:pointer-events-none"
                        title="Revoke Key"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Security warning card */}
      <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] p-4 flex gap-3 text-xs text-[var(--foreground-2)] leading-relaxed">
        <AlertTriangle className="size-5 text-amber shrink-0" />
        <div>
          <strong>Security Advisory:</strong> API Keys grant full programmatic read/write access to
          your business reality engine. Never share keys publicly or commit them in open source
          repositories.
        </div>
      </div>

      {/* Create Key Modal (Overlay State) */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleCreateKey}
              className="w-full max-w-[480px] glass-panel rounded-2xl p-6 bg-[var(--surface-1)] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                <h3 className="text-sm font-bold text-foreground">Create API Key</h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--foreground-3)] hover:bg-[var(--surface-2)] hover:text-foreground transition-all"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Key Name */}
                <div className="space-y-1.5">
                  <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                    Key name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Core Webhook"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  />
                </div>

                {/* Grid for Environment & Permissions */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Environment */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                      Environment
                    </label>
                    <select
                      value={env}
                      onChange={(e) => setEnv(e.target.value as any)}
                      className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      <option value="Live">Live (Production)</option>
                      <option value="Test">Test (Sandbox)</option>
                    </select>
                  </div>

                  {/* Permissions */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                      Permissions
                    </label>
                    <select className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary">
                      <option>Read Only</option>
                      <option>Read + Write</option>
                      <option>Admin Access</option>
                    </select>
                  </div>
                </div>

                {/* Expiry select */}
                <div className="space-y-1.5">
                  <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                    Expiry
                  </label>
                  <select className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary">
                    <option>Never</option>
                    <option>30 Days</option>
                    <option>90 Days</option>
                    <option>1 Year</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--glass-border)] rounded-lg text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--foreground-2)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:brightness-110 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Create Key
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
