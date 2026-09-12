"use client";

import { motion, type Variants } from "framer-motion";
import { ExternalLink, RotateCcw } from "lucide-react";
import type { RepoAnalysis } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ScoreGauge } from "@/components/dashboard/ScoreGauge";
import { ScoreBreakdown } from "@/components/dashboard/ScoreBreakdown";
import { OverviewGrid } from "@/components/dashboard/OverviewGrid";
import { CommitActivityChart } from "@/components/dashboard/CommitActivityChart";
import { ContributorsChart } from "@/components/dashboard/ContributorsChart";
import { LanguageDonut } from "@/components/dashboard/LanguageDonut";
import { PullRequestCard } from "@/components/dashboard/PullRequestCard";
import { IssueCard } from "@/components/dashboard/IssueCard";
import { BranchCard } from "@/components/dashboard/BranchCard";
import { CommunityChecklist } from "@/components/dashboard/CommunityChecklist";
import { timeAgo } from "@/lib/utils";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Dashboard({
  analysis,
  onReset,
}: {
  analysis: RepoAnalysis;
  onReset: () => void;
}) {
  const { overview } = analysis;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <motion.div
        variants={item}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold sm:text-3xl">
              {overview.fullName}
            </h1>
            <a
              href={overview.url}
              target="_blank"
              rel="noreferrer"
              className="text-muted hover:text-foreground"
            >
              <ExternalLink className="size-4" />
            </a>
            {overview.archived && (
              <span className="rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs text-yellow-400">
                Archived
              </span>
            )}
          </div>
          {overview.description && (
            <p className="mt-1.5 max-w-2xl text-muted">{overview.description}</p>
          )}
          <p className="mt-1.5 text-xs text-muted">
            Last pushed {timeAgo(overview.pushedAt)} · Created{" "}
            {new Date(overview.createdAt).getFullYear()}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/50 hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          New search
        </button>
      </motion.div>

      <motion.div variants={item} className="mb-6">
        <OverviewGrid overview={overview} branches={analysis.branches} />
      </motion.div>

      <motion.div variants={item} className="mb-6">
        <Card className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <ScoreGauge score={analysis.score} />
          </div>
          <div className="w-full min-w-0 border-t border-border pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <ScoreBreakdown score={analysis.score} />
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <CommitActivityChart
            data={analysis.commitActivity}
            pending={analysis.statsPending}
          />
        </motion.div>
        <motion.div variants={item}>
          <LanguageDonut languages={analysis.languages} />
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <ContributorsChart
            contributors={analysis.contributors}
            total={analysis.totalContributors}
            pending={analysis.statsPending}
          />
        </motion.div>
        <motion.div variants={item}>
          <BranchCard branches={analysis.branches} />
        </motion.div>

        <motion.div variants={item}>
          <PullRequestCard pr={analysis.pullRequests} />
        </motion.div>
        <motion.div variants={item}>
          <IssueCard issues={analysis.issues} />
        </motion.div>
        <motion.div variants={item}>
          <CommunityChecklist community={analysis.community} />
        </motion.div>
      </div>
    </motion.div>
  );
}
