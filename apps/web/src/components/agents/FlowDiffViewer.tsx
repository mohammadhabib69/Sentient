import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, GitCommit } from "lucide-react";

interface FlowDiffViewerProps {
  oldFlow: { nodes: unknown[]; edges: unknown[] } | null;
  newFlow: { nodes: unknown[]; edges: unknown[] };
}

export function FlowDiffViewer({ oldFlow, newFlow }: FlowDiffViewerProps) {
  const [oldExpanded, setOldExpanded] = React.useState(false);
  const [newExpanded, setNewExpanded] = React.useState(false);

  const oldNodes = oldFlow?.nodes as any[] ?? [];
  const newNodes = newFlow?.nodes as any[] ?? [];
  const oldEdges = oldFlow?.edges as any[] ?? [];
  const newEdges = newFlow?.edges as any[] ?? [];

  const nodeDiff = {
    added: newNodes.filter(
      (n) => !oldNodes.find((o) => o.id === n.id),
    ),
    removed: oldNodes.filter(
      (n) => !newNodes.find((o) => o.id === n.id),
    ),
    modified: newNodes.filter((n) => {
      const old = oldNodes.find((o) => o.id === n.id);
      if (!old) return false;
      return JSON.stringify(old.data) !== JSON.stringify(n.data);
    }),
  };

  const edgeDiff = {
    added: newEdges.filter(
      (e) => !oldEdges.find((o) => o.id === e.id),
    ),
    removed: oldEdges.filter(
      (e) => !newEdges.find((o) => o.id === e.id),
    ),
  };

  const totalChanges =
    nodeDiff.added.length +
    nodeDiff.removed.length +
    nodeDiff.modified.length +
    edgeDiff.added.length +
    edgeDiff.removed.length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitCommit className="size-4" />
            Flow Changes
          </CardTitle>
          <Badge variant={totalChanges > 0 ? "default" : "secondary"}>
            {totalChanges} change{totalChanges !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3 text-xs">
            {/* Added Nodes */}
            {nodeDiff.added.length > 0 && (
              <div className="space-y-1">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  + Added Nodes ({nodeDiff.added.length})
                </div>
                {nodeDiff.added.map((n) => (
                  <div key={n.id} className="ml-2 text-[var(--foreground-2)] font-mono">
                    • {n.data?.label ?? n.type ?? n.id}
                  </div>
                ))}
              </div>
            )}

            {/* Removed Nodes */}
            {nodeDiff.removed.length > 0 && (
              <div className="space-y-1">
                <div className="font-semibold text-red-600 dark:text-red-400">
                  - Removed Nodes ({nodeDiff.removed.length})
                </div>
                {nodeDiff.removed.map((n) => (
                  <div key={n.id} className="ml-2 text-[var(--foreground-2)] font-mono">
                    • {n.data?.label ?? n.type ?? n.id}
                  </div>
                ))}
              </div>
            )}

            {/* Modified Nodes */}
            {nodeDiff.modified.length > 0 && (
              <div className="space-y-1">
                <div className="font-semibold text-amber-600 dark:text-amber-400">
                  ~ Modified Nodes ({nodeDiff.modified.length})
                </div>
                {nodeDiff.modified.map((n) => (
                  <div key={n.id} className="ml-2 space-y-1">
                    <div className="text-[var(--foreground-2)] font-mono">
                      • {n.data?.label ?? n.type ?? n.id}
                    </div>
                    <div className="ml-4 flex gap-4">
                      <div
                        className="cursor-pointer text-[var(--foreground-3)]"
                        onClick={() => setOldExpanded(!oldExpanded)}
                      >
                        {oldExpanded ? (
                          <ChevronDown className="size-3 inline mr-1" />
                        ) : (
                          <ChevronRight className="size-3 inline mr-1" />
                        )}
                        old
                      </div>
                      <div
                        className="cursor-pointer text-[var(--foreground-3)]"
                        onClick={() => setNewExpanded(!newExpanded)}
                      >
                        {newExpanded ? (
                          <ChevronDown className="size-3 inline mr-1" />
                        ) : (
                          <ChevronRight className="size-3 inline mr-1" />
                        )}
                        new
                      </div>
                    </div>
                    {oldExpanded && (
                      <pre className="ml-4 bg-[var(--surface-3)] p-2 rounded text-[10px] overflow-auto max-h-32">
                        {JSON.stringify(
                          oldNodes.find((o) => o.id === n.id)?.data,
                          null,
                          2,
                        )}
                      </pre>
                    )}
                    {newExpanded && (
                      <pre className="ml-4 bg-[var(--surface-3)] p-2 rounded text-[10px] overflow-auto max-h-32">
                        {JSON.stringify(n.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Added Edges */}
            {edgeDiff.added.length > 0 && (
              <div className="space-y-1">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  + Added Edges ({edgeDiff.added.length})
                </div>
                {edgeDiff.added.map((e) => (
                  <div key={e.id} className="ml-2 text-[var(--foreground-3)] font-mono">
                    • {e.source} → {e.target}
                  </div>
                ))}
              </div>
            )}

            {/* Removed Edges */}
            {edgeDiff.removed.length > 0 && (
              <div className="space-y-1">
                <div className="font-semibold text-red-600 dark:text-red-400">
                  - Removed Edges ({edgeDiff.removed.length})
                </div>
                {edgeDiff.removed.map((e) => (
                  <div key={e.id} className="ml-2 text-[var(--foreground-3)] font-mono">
                    • {e.source} → {e.target}
                  </div>
                ))}
              </div>
            )}

            {totalChanges === 0 && (
              <div className="text-center text-[var(--foreground-3)] py-4">
                No changes detected
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
