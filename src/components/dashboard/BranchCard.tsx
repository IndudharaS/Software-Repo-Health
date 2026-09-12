"use client";

import { Card } from "@/components/ui/Card";
import { GitBranch } from "lucide-react";
import type { BranchInfo } from "@/lib/types";

export function BranchCard({ branches }: { branches: BranchInfo }) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <GitBranch className="size-4 text-muted" />
        <h3 className="font-medium">Branches</h3>
      </div>
      <div className="text-2xl font-semibold tabular-nums">
        {branches.truncated ? `${branches.total}+` : branches.total}
      </div>
      <p className="mb-3 text-xs text-muted">
        default: <span className="font-mono">{branches.defaultBranch}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {branches.names.map((name) => (
          <span
            key={name}
            className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted"
          >
            {name}
          </span>
        ))}
      </div>
    </Card>
  );
}
