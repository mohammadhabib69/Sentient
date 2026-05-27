"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Globe, Copy, CheckSquare, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Webhook {
  id: string;
  name: string;
  url: string;
  active: boolean;
  events: string[];
  metrics: {
    lastTriggered: string;
    deliveries: number;
    success: number;
    failed: number;
  };
}

const AVAILABLE_EVENTS = [
  "agent.action.approved",
  "anomaly.detected",
  "task.blocked",
  "task.assigned",
  "project.status.changed",
  "billing.failed",
];

export default function WebhooksPage() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Local webhooks list state
  const [webhooks, setWebhooks] = React.useState<Webhook[]>([
    {
      id: "wh_1",
      name: "Production Alerts",
      url: "https://hooks.acme.com/sentient",
      active: true,
      events: ["agent.action.approved", "anomaly.detected", "task.blocked"],
      metrics: { lastTriggered: "2m ago", deliveries: 247, success: 245, failed: 2 },
    },
    {
      id: "wh_2",
      name: "Slack Notifications",
      url: "https://hooks.slack.com/services/T00/B00/xxx",
      active: true,
      events: ["task.assigned", "project.status.changed"],
      metrics: { lastTriggered: "15m ago", deliveries: 120, success: 120, failed: 0 },
    },
  ]);

  // Form states
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [checkedEvents, setCheckedEvents] = React.useState<string[]>([]);
  const [secretKey] = React.useState("whsec_5d09f7a8...e42b");

  const handleToggleWebhook = (id: string, name: string) => {
    setWebhooks((prev) => prev.map((wh) => (wh.id === id ? { ...wh, active: !wh.active } : wh)));
    toast.success(`Webhook "${name}" updated.`);
  };

  const handleToggleEvent = (event: string) => {
    setCheckedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    toast.success("Webhook signing secret copied!");
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || checkedEvents.length === 0) {
      toast.error("Please fill in all fields and select at least one event.");
      return;
    }

    const newWh: Webhook = {
      id: "wh_" + Date.now(),
      name,
      url,
      active: true,
      events: checkedEvents,
      metrics: {
        lastTriggered: "Never",
        deliveries: 0,
        success: 0,
        failed: 0,
      },
    };

    setWebhooks([...webhooks, newWh]);
    // Reset form
    setName("");
    setUrl("");
    setCheckedEvents([]);
    setDrawerOpen(false);
    toast.success(`Added webhook "${newWh.name}" successfully!`);
  };

  return (
    <div className="space-y-6 relative">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">Webhooks</h2>
          <p className="text-xs text-[var(--foreground-2)]">
            Subscribe to real-time events from your AI fleet
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary hover:brightness-110 text-white shadow-sm transition-all"
        >
          <Plus className="size-4" /> Add Webhook
        </button>
      </div>

      {/* Webhooks cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {webhooks.map((wh) => (
          <div
            key={wh.id}
            className="glass-panel rounded-xl p-5 flex flex-col justify-between gap-4 border border-[var(--glass-border)]"
          >
            {/* Top row Info + Toggle */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Globe className="size-4 text-primary" />
                  {wh.name}
                </h3>
                <code className="text-[11px] font-mono text-[var(--foreground-2)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--glass-border)] break-all max-w-[280px] inline-block truncate">
                  {wh.url}
                </code>
              </div>

              {/* Active Toggle Switch */}
              <div
                onClick={() => handleToggleWebhook(wh.id, wh.name)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out select-none",
                  wh.active ? "bg-primary" : "bg-[var(--surface-3)]",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    wh.active ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </div>
            </div>

            {/* Event subscription chips */}
            <div className="flex flex-wrap gap-1.5">
              {wh.events.map((evt) => (
                <span
                  key={evt}
                  className="font-mono text-[10px] bg-[var(--surface-2)] text-primary border border-[var(--glass-border)] px-1.5 py-0.5 rounded"
                >
                  {evt}
                </span>
              ))}
            </div>

            {/* Delivery metrics */}
            <div className="pt-3 border-t border-[var(--glass-border)] flex flex-col gap-1 text-[11px] font-mono text-[var(--foreground-3)]">
              <div className="flex items-center justify-between">
                <span>Last Triggered:</span>
                <span className="text-[var(--foreground-2)]">{wh.metrics.lastTriggered}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Deliveries:</span>
                <span className="text-[var(--foreground-2)]">
                  {wh.metrics.deliveries} ({wh.metrics.success} success, {wh.metrics.failed} failed)
                </span>
              </div>
              <div className="flex justify-end pt-1">
                <button className="text-[10px] font-bold text-primary hover:underline uppercase">
                  View logs &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer slide panel Add Webhook (Width 420px glass drawer) */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-y-0 right-0 z-50 flex justify-end">
            {/* Backdrop layer */}
            <div
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-background/30 backdrop-blur-[2px]"
            />

            <motion.form
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onSubmit={handleSaveWebhook}
              className="relative w-full max-w-[420px] h-full bg-[var(--surface-1)] glass-panel border-l border-[var(--glass-border)] p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-none">
                <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                  <h3 className="text-sm font-bold text-foreground">Add Webhook</h3>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 rounded-lg text-[var(--foreground-3)] hover:text-foreground hover:bg-[var(--surface-2)]"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                      Webhook Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Production alerts webhook"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  {/* URL */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                      Payload URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://yourdomain.com/webhooks"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-2)] px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  {/* Secret copy */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                      Signing Secret
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={secretKey}
                        className="flex-1 h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-3)] px-3 text-xs font-mono text-[var(--foreground-2)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="px-3 border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Searchable select events check list */}
                  <div className="space-y-2">
                    <label className="font-mono text-label-caps uppercase tracking-wider text-[var(--foreground-2)]">
                      Event Subscriptions
                    </label>
                    <div className="border border-[var(--glass-border)] rounded-lg max-h-[180px] overflow-y-auto divide-y divide-[var(--glass-border)] p-1 bg-[var(--surface-2)]">
                      {AVAILABLE_EVENTS.map((evt) => {
                        const isChecked = checkedEvents.includes(evt);
                        return (
                          <div
                            key={evt}
                            onClick={() => handleToggleEvent(evt)}
                            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[var(--surface-3)] transition-colors select-none text-xs font-mono"
                          >
                            <div
                              className={cn(
                                "size-4 border rounded flex items-center justify-center transition-all",
                                isChecked
                                  ? "border-primary bg-primary text-white"
                                  : "border-[var(--glass-border)]",
                              )}
                            >
                              {isChecked && <CheckSquare className="size-3" />}
                            </div>
                            <span className="text-[var(--foreground-2)]">{evt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 border border-[var(--glass-border)] rounded-lg text-xs font-semibold hover:bg-[var(--surface-2)] text-[var(--foreground-2)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:brightness-110 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Save Webhook
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
