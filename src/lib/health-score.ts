import type {
  RepoOverview,
  CommunityHealth,
  CommitWeek,
  Contributor,
  PullRequestStats,
  IssueStats,
  HealthScore,
  ScoreBreakdown,
} from "./types";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function scoreActivity(
  overview: RepoOverview,
  commitActivity: CommitWeek[]
): ScoreBreakdown {
  const daysSincePush =
    (Date.now() - new Date(overview.pushedAt).getTime()) / 864e5;

  let recencyScore: number;
  if (daysSincePush <= 7) recencyScore = 15;
  else if (daysSincePush <= 30) recencyScore = 12;
  else if (daysSincePush <= 90) recencyScore = 8;
  else if (daysSincePush <= 180) recencyScore = 4;
  else if (daysSincePush <= 365) recencyScore = 2;
  else recencyScore = 0;

  let sustainedScore = 5;
  if (commitActivity.length > 0) {
    const activeWeeks = commitActivity.filter((w) => w.total > 0).length;
    const fraction = activeWeeks / commitActivity.length;
    sustainedScore = clamp(Math.round(fraction * 10), 0, 10);
  }

  const score = recencyScore + sustainedScore;
  return {
    key: "activity",
    label: "Activity & Recency",
    score,
    maxScore: 25,
    detail:
      daysSincePush < 1
        ? "Last push today"
        : `Last push ${Math.round(daysSincePush)} day${
            Math.round(daysSincePush) === 1 ? "" : "s"
          } ago`,
  };
}

function scoreCommunity(community: CommunityHealth): ScoreBreakdown {
  const pct = community.healthPercentage ?? 0;
  const score = Math.round((pct / 100) * 20);
  return {
    key: "community",
    label: "Community Health",
    score,
    maxScore: 20,
    detail:
      community.healthPercentage !== null
        ? `GitHub community profile: ${pct}%`
        : "Community profile unavailable",
  };
}

function scorePullRequests(pr: PullRequestStats): ScoreBreakdown {
  const totalClosed = pr.merged + pr.closedUnmerged;
  let mergeRateScore = 7;
  if (totalClosed > 0) {
    const rate = pr.merged / totalClosed;
    mergeRateScore = clamp(Math.round(rate * 10), 0, 10);
  }

  let speedScore = 5;
  if (pr.avgMergeTimeHours !== null) {
    const days = pr.avgMergeTimeHours / 24;
    if (days <= 1) speedScore = 10;
    else if (days <= 3) speedScore = 9;
    else if (days <= 7) speedScore = 7;
    else if (days <= 14) speedScore = 5;
    else if (days <= 30) speedScore = 3;
    else speedScore = 1;
  }

  const score = mergeRateScore + speedScore;
  return {
    key: "pullRequests",
    label: "Pull Request Velocity",
    score,
    maxScore: 20,
    detail:
      pr.avgMergeTimeHours !== null
        ? `~${Math.round(pr.avgMergeTimeHours / 24) || "<1"} day avg to merge`
        : "No recent merged PR data",
  };
}

function scoreIssues(issues: IssueStats): ScoreBreakdown {
  const total = issues.open + issues.closed;
  let closeRateScore = 4;
  if (total > 0) {
    const rate = issues.closed / total;
    closeRateScore = clamp(Math.round(rate * 8), 0, 8);
  }

  let speedScore = 4;
  if (issues.avgCloseTimeHours !== null) {
    const days = issues.avgCloseTimeHours / 24;
    if (days <= 2) speedScore = 7;
    else if (days <= 7) speedScore = 6;
    else if (days <= 30) speedScore = 4;
    else if (days <= 90) speedScore = 2;
    else speedScore = 1;
  }

  const score = closeRateScore + speedScore;
  return {
    key: "issues",
    label: "Issue Resolution",
    score,
    maxScore: 15,
    detail:
      total > 0
        ? `${Math.round((issues.closed / total) * 100)}% of issues closed`
        : "No issues found",
  };
}

function scoreContributors(contributors: Contributor[]): ScoreBreakdown {
  const count = contributors.length;
  let countScore: number;
  if (count >= 10) countScore = 12;
  else if (count >= 4) countScore = 9;
  else if (count >= 2) countScore = 6;
  else countScore = 3;

  let busFactorPenalty = 0;
  const totalContributions = contributors.reduce(
    (a, c) => a + c.contributions,
    0
  );
  if (totalContributions > 0 && contributors.length > 1) {
    const topShare = contributors[0].contributions / totalContributions;
    if (topShare > 0.9) busFactorPenalty = 3;
    else if (topShare > 0.75) busFactorPenalty = 1;
  }

  const score = clamp(countScore - busFactorPenalty, 0, 15);
  return {
    key: "contributors",
    label: "Contributor Diversity",
    score,
    maxScore: 15,
    detail: `${count} contributor${count === 1 ? "" : "s"}`,
  };
}

function gradeFor(total: number): { grade: HealthScore["grade"]; label: string } {
  if (total >= 85) return { grade: "A", label: "Excellent" };
  if (total >= 70) return { grade: "B", label: "Good" };
  if (total >= 50) return { grade: "C", label: "Fair" };
  if (total >= 30) return { grade: "D", label: "Needs Attention" };
  return { grade: "F", label: "At Risk" };
}

export function computeHealthScore(input: {
  overview: RepoOverview;
  community: CommunityHealth;
  commitActivity: CommitWeek[];
  contributors: Contributor[];
  pullRequests: PullRequestStats;
  issues: IssueStats;
}): HealthScore {
  const breakdown: ScoreBreakdown[] = [
    scoreActivity(input.overview, input.commitActivity),
    scoreCommunity(input.community),
    scorePullRequests(input.pullRequests),
    scoreIssues(input.issues),
    scoreContributors(input.contributors),
  ];

  let total = breakdown.reduce((a, b) => a + b.score, 0);

  if (input.overview.archived) {
    total = Math.min(total, 25);
  }

  const { grade, label } = gradeFor(total);

  return {
    total: Math.round(total),
    grade,
    gradeLabel: input.overview.archived ? "Archived" : label,
    breakdown,
  };
}
