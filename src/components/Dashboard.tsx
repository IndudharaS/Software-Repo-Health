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
import { NetworkGraphSection } from "@/components/dashboard/NetworkGraphSection";
import { timeAgo } from "@/lib/utils";

// Header animates in immediately on mount (it's above the fold). Everything
// below reveals itself as it scrolls into view via <Reveal>, rather than all
// at once on load.
const headerVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Dashboard({
  analysis,
  onReset,
}: {
  analysis: RepoAnalysis;
  onReset: () => void;
}) {
  const { overview } = analysis;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.div
        initial="hidden"
        animate="show"
        variants={headerVariants}
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

      <Reveal className="mb-6">
        <OverviewGrid overview={overview} branches={analysis.branches} />
      </Reveal>

      <Reveal className="mb-6">
        <Card className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <ScoreGauge score={analysis.score} />
          </div>
          <div className="w-full min-w-0 border-t border-border pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <ScoreBreakdown score={analysis.score} />
          </div>
        </Card>
      </Reveal>

      <Reveal className="mb-6">
        <NetworkGraphSection
          contributors={analysis.contributors}
          pending={analysis.statsPending}
        />
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <CommitActivityChart
            data={analysis.commitActivity}
            pending={analysis.statsPending}
          />
        </Reveal>
        <Reveal delay={0.1}>
          <LanguageDonut languages={analysis.languages} />
        </Reveal>

        <Reveal className="lg:col-span-2">
          <ContributorsChart
            contributors={analysis.contributors}
            total={analysis.totalContributors}
            pending={analysis.statsPending}
          />
        </Reveal>
        <Reveal delay={0.1}>
          <BranchCard branches={analysis.branches} />
        </Reveal>

        <Reveal>
          <PullRequestCard pr={analysis.pullRequests} />
        </Reveal>
        <Reveal delay={0.08}>
          <IssueCard issues={analysis.issues} />
        </Reveal>
        <Reveal delay={0.16}>
          <CommunityChecklist community={analysis.community} />
        </Reveal>
      </div>
    </div>
  );
}
