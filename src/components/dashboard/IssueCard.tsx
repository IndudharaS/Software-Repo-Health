"use client";

import { Card } from "@/components/ui/Card";
import { STATUS } from "@/lib/chart-colors";
import { formatDuration } from "@/lib/utils";
import type { IssueStats } from "@/lib/types";
import { CircleDot } from "lucide-react";

export function IssueCard({ issues }: { issues: IssueStats }) {
  const total = issues.open + issues.closed || 1;
  const segments = [
    { label: "Open", value: issues.open, color: STATUS.warning },
    { label: "Closed", value: issues.closed, color: STATUS.good },
  ];

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <CircleDot className="size-4 text-muted" />
        <h3 className="font-medium">Issues</h3>
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

      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
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
        {issues.avgCloseTimeHours !== null ? (
          <>
            Avg. time to close{" "}
            <span className="font-medium text-foreground">
              {formatDuration(issues.avgCloseTimeHours)}
            </span>{" "}
            <span className="text-xs">(last {issues.sampleSize} closed)</span>
          </>
        ) : (
          "No recent close data available."
        )}
      </div>
    </Card>
  );
}
