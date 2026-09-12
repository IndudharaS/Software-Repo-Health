"use client";

import { motion } from "framer-motion";
import { GitBranch } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { STATUS } from "@/lib/chart-colors";
import type { BranchInfo, BranchActivityEntry } from "@/lib/types";

function recencyColor(lastCommitAt: string | null): string {
  if (!lastCommitAt) return "#5c5c68";
  const days = (Date.now() - new Date(lastCommitAt).getTime()) / 864e5;
  if (days <= 30) return STATUS.good;
  if (days <= 180) return STATUS.warning;
  return STATUS.critical;
}

function timeAgoShort(dateStr: string | null): string {
  if (!dateStr) return "unknown";
  const days = (Date.now() - new Date(dateStr).getTime()) / 864e5;
  if (days < 1) return "today";
  if (days < 30) return `${Math.round(days)}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${(days / 365).toFixed(1)}y ago`;
}

export function BranchCard({
  branches,
  activity,
}: {
  branches: BranchInfo;
  activity: BranchActivityEntry[];
}) {
  const maxAhead = Math.max(...activity.map((a) => a.aheadBy), 1);
  const sorted = [...activity].sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return b.aheadBy - a.aheadBy;
  });

  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <GitBranch className="size-4 text-muted" />
        <h3 className="font-medium">Branches</h3>
      </div>
      <p className="mb-4 text-xs text-muted">
        {branches.truncated ? `${branches.total}+` : branches.total} total ·
        default <span className="font-mono">{branches.defaultBranch}</span>
      </p>

      {activity.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-muted">
          No branch activity available.
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              title={
                b.isDefault
                  ? "Default branch"
                  : `${b.aheadBy} commit${b.aheadBy === 1 ? "" : "s"} ahead, ${b.behindBy} behind ${branches.defaultBranch}`
              }
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: recencyColor(b.lastCommitAt) }}
              />
              <span className="w-24 shrink-0 truncate font-mono text-muted sm:w-28">
                {b.name}
              </span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8">
                {!b.isDefault && (
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.max(4, (b.aheadBy / maxAhead) * 100)}%`,
                    }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }}
                  />
                )}
              </div>
              <span className="w-14 shrink-0 text-right text-muted">
                {timeAgoShort(b.lastCommitAt)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}
