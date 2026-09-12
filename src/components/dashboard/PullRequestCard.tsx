"use client";

import { Card } from "@/components/ui/Card";
import { STATUS } from "@/lib/chart-colors";
import { formatDuration } from "@/lib/utils";
import type { PullRequestStats } from "@/lib/types";
import { GitPullRequest } from "lucide-react";

export function PullRequestCard({ pr }: { pr: PullRequestStats }) {
  const total = pr.open + pr.merged + pr.closedUnmerged || 1;
  const segments = [
    { label: "Open", value: pr.open, color: STATUS.warning },
    { label: "Merged", value: pr.merged, color: STATUS.good },
    { label: "Closed", value: pr.closedUnmerged, color: STATUS.critical },
  ];

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <GitPullRequest className="size-4 text-muted" />
        <h3 className="font-medium">Pull requests</h3>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-white/8">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{
              width: `${(s.value / total) * 100}%`,
              backgroundColor: s.color,
            }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {segments.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-muted">{s.label}</span>
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-3 text-sm text-muted">
        {pr.avgMergeTimeHours !== null ? (
          <>
            Avg. time to merge{" "}
            <span className="font-medium text-foreground">
              {formatDuration(pr.avgMergeTimeHours)}
            </span>{" "}
            <span className="text-xs">(last {pr.sampleSize} merged)</span>
          </>
        ) : (
          "No recent merge data available."
        )}
      </div>
    </Card>
  );
}
