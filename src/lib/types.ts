export interface RepoOverview {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssuesAndPRs: number;
  defaultBranch: string;
  license: string | null;
  createdAt: string;
  pushedAt: string;
  updatedAt: string;
  sizeKb: number;
  archived: boolean;
  disabled: boolean;
  topics: string[];
}

export interface CommunityHealth {
  healthPercentage: number | null;
  hasReadme: boolean;
  hasLicense: boolean;
  hasContributing: boolean;
  hasCodeOfConduct: boolean;
  hasIssueTemplate: boolean;
  hasPullRequestTemplate: boolean;
}

export interface CommitWeek {
  weekStart: string;
  total: number;
}

export interface ContributorActiveWeek {
  weekStart: string;
  commits: number;
}

export interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
  weeks: ContributorActiveWeek[];
}

export interface LanguageBreakdown {
  name: string;
  bytes: number;
  percent: number;
}

export interface PullRequestStats {
  open: number;
  merged: number;
  closedUnmerged: number;
  avgMergeTimeHours: number | null;
  sampleSize: number;
}

export interface IssueStats {
  open: number;
  closed: number;
  avgCloseTimeHours: number | null;
  sampleSize: number;
}

export interface BranchInfo {
  total: number;
  truncated: boolean;
  defaultBranch: string;
  names: string[];
}

export interface BranchActivityEntry {
  name: string;
  isDefault: boolean;
  aheadBy: number;
  behindBy: number;
  lastCommitAt: string | null;
}

export interface DependencyEntry {
  packageName: string;
  packageManager: string | null;
  requirements: string;
}

export interface DependencyGraphData {
  manifestFilename: string | null;
  dependencies: DependencyEntry[];
  totalInManifest: number;
}

export interface ScoreBreakdown {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  detail: string;
}

export interface HealthScore {
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
  gradeLabel: string;
  breakdown: ScoreBreakdown[];
}

export interface RepoAnalysis {
  overview: RepoOverview;
  community: CommunityHealth;
  commitActivity: CommitWeek[];
  contributors: Contributor[];
  totalContributors: number;
  languages: LanguageBreakdown[];
  pullRequests: PullRequestStats;
  issues: IssueStats;
  branches: BranchInfo;
  branchActivity: BranchActivityEntry[];
  dependencyGraph: DependencyGraphData;
  score: HealthScore;
  statsPending: boolean;
}

export interface AnalyzeErrorResponse {
  error: string;
}
