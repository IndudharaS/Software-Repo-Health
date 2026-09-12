"use client";

import { motion } from "framer-motion";
import { Star, GitFork, Eye, CircleDot, Scale, GitBranch } from "lucide-react";
import type { RepoOverview, BranchInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

function Stat({
  icon: Icon,
  label,
  value,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center gap-2 text-muted">
        <Icon className="size-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1.5 text-xl font-semibold tabular-nums">{value}</div>
    </motion.div>
  );
}

export function OverviewGrid({
  overview,
  branches,
}: {
  overview: RepoOverview;
  branches: BranchInfo;
}) {
  const stats = [
    { icon: Star, label: "Stars", value: formatNumber(overview.stars) },
    { icon: GitFork, label: "Forks", value: formatNumber(overview.forks) },
    { icon: Eye, label: "Watchers", value: formatNumber(overview.watchers) },
    {
      icon: CircleDot,
      label: "Open issues + PRs",
      value: formatNumber(overview.openIssuesAndPRs),
    },
    {
      icon: GitBranch,
      label: "Branches",
      value: `${branches.truncated ? `${branches.total}+` : branches.total}`,
    },
    { icon: Scale, label: "License", value: overview.license ?? "None" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s, i) => (
        <Stat key={s.label} index={i} {...s} />
      ))}
    </div>
  );
}
