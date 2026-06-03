import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, ArrowLeft, Undo2 } from "lucide-react";
import { useCustomAgentVersions, useRollbackCustomAgent } from "@/hooks/useCustomAgents";
import { toast } from "sonner";
import { FlowDiffViewer } from "./FlowDiffViewer";

interface VersionHistoryPanelProps {
  agentId: string;
  currentFlow: { nodes: unknown[]; edges: unknown[] };
}

export function VersionHistoryPanel({ agentId, currentFlow }: VersionHistoryPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedVersion, setSelectedVersion] = React.useState<{
    version: number;
    flow: unknown;
  } | null>(null);

  const { data: versions = [] } = useCustomAgentVersions(agentId);
  const rollbackMutation = useRollbackCustomAgent(agentId);

  const handleRollback = async (version: number) => {
    try {
      await rollbackMutation.mutateAsync(version);
      toast.success(`Rolled back to version ${version}`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rollback");
    }
  };

  const latestVersion = versions.length > 0 ? (versions[0]?.version ?? 0) : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Button variant="outline" size="sm" className="gap-1.5">
          <History className="size-3.5" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px]">
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
          <SheetDescription>
            {versions.length} version{versions.length !== 1 ? "s" : ""} saved
          </SheetDescription>
        </SheetHeader>

        {selectedVersion ? (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 mb-4"
              onClick={() => setSelectedVersion(null)}
            >
              <ArrowLeft className="size-3.5" />
              Back to versions
            </Button>
            <FlowDiffViewer
              oldFlow={selectedVersion.flow as any}
              newFlow={currentFlow}
            />
          </div>
        ) : (
          <ScrollArea className="mt-4 h-[calc(100vh-140px)]">
            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--surface-1)]"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.version === latestVersion ? "default" : "outline"}>
                        v{v.version}
                      </Badge>
                      {v.version === latestVersion && (
                        <span className="text-[10px] text-[var(--foreground-3)]">
                          Current
                        </span>
                      )}
                    </div>
                    {v.changeNote && (
                      <span className="text-[10px] text-[var(--foreground-3)] mt-1">
                        {v.changeNote}
                      </span>
                    )}
                    <span className="text-[9px] text-[var(--foreground-3)] mt-0.5">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0"
                      onClick={() =>
                        setSelectedVersion({
                          version: v.version,
                          flow: v.flowDefinition,
                        })
                      }
                      title="Compare"
                    >
                      <ArrowLeft className="size-3.5 rotate-180" />
                    </Button>
                    {v.version < latestVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-6 p-0 text-amber-600"
                        onClick={() => handleRollback(v.version)}
                        title="Rollback"
                        disabled={rollbackMutation.isPending}
                      >
                        <Undo2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {versions.length === 0 && (
                <div className="text-center text-[var(--foreground-3)] py-8 text-sm">
                  No version history yet. Save the agent to create your first version.
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
