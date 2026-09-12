import { Octokit } from "@octokit/rest";
import type {
  RepoOverview,
  CommunityHealth,
  CommitWeek,
  Contributor,
  LanguageBreakdown,
  PullRequestStats,
  IssueStats,
  BranchInfo,
} from "./types";

export class RepoNotFoundError extends Error {
  constructor() {
    super("Repository not found. Check the URL and make sure it's public.");
    this.name = "RepoNotFoundError";
  }
}

export class InvalidUrlError extends Error {
  constructor() {
    super("That doesn't look like a valid GitHub repository URL.");
    this.name = "InvalidUrlError";
  }
}

export class RateLimitError extends Error {
  constructor() {
    super("GitHub API rate limit reached. Please try again in a few minutes.");
    this.name = "RateLimitError";
  }
}

export function parseGitHubUrl(input: string): { owner: string; repo: string } {
  const trimmed = input.trim();

  let candidate = trimmed;
  candidate = candidate.replace(/^git@github\.com:/i, "github.com/");
  candidate = candidate.replace(/^(https?:\/\/)?(www\.)?/i, "");

  const shorthandMatch = candidate.match(/^([\w.-]+)\/([\w.-]+?)(\.git)?\/?$/);
  if (!candidate.includes("github.com") && shorthandMatch) {
    return { owner: shorthandMatch[1], repo: shorthandMatch[2] };
  }

  const match = candidate.match(
    /^github\.com\/([\w.-]+)\/([\w.-]+?)(\.git)?(\/.*)?$/i
  );
  if (!match) {
    throw new InvalidUrlError();
  }
  return { owner: match[1], repo: match[2] };
}

function getOctokit(): Octokit {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: "repo-health-analyzer",
  });
}

async function handleOctokitError(err: unknown): Promise<never> {
  const status = (err as { status?: number })?.status;
  if (status === 404) throw new RepoNotFoundError();
  if (status === 403 || status === 429) throw new RateLimitError();
  throw err;
}

export async function fetchRepoOverview(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<RepoOverview> {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return {
    owner: data.owner.login,
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    url: data.html_url,
    homepage: data.homepage,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.subscribers_count ?? data.watchers_count,
    openIssuesAndPRs: data.open_issues_count,
    defaultBranch: data.default_branch,
    license: data.license?.spdx_id ?? data.license?.name ?? null,
    createdAt: data.created_at,
    pushedAt: data.pushed_at ?? data.updated_at,
    updatedAt: data.updated_at,
    sizeKb: data.size,
    archived: data.archived,
    disabled: data.disabled,
    topics: data.topics ?? [],
  };
}

export async function fetchCommunityHealth(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<CommunityHealth> {
  try {
    const { data } = await octokit.rest.repos.getCommunityProfileMetrics({
      owner,
      repo,
    });
    const files = data.files;
    return {
      healthPercentage: data.health_percentage,
      hasReadme: !!files.readme,
      hasLicense: !!files.license,
      hasContributing: !!files.contributing,
      hasCodeOfConduct: !!files.code_of_conduct,
      hasIssueTemplate: !!files.issue_template,
      hasPullRequestTemplate: !!files.pull_request_template,
    };
  } catch {
    return {
      healthPercentage: null,
      hasReadme: false,
      hasLicense: false,
      hasContributing: false,
      hasCodeOfConduct: false,
      hasIssueTemplate: false,
      hasPullRequestTemplate: false,
    };
  }
}

export async function fetchCommitActivity(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{ weeks: CommitWeek[]; pending: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await octokit.rest.repos.getCommitActivityStats({
      owner,
      repo,
    });
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
      return {
        weeks: res.data.map((w) => ({
          weekStart: new Date(w.week * 1000).toISOString(),
          total: w.total,
        })),
        pending: false,
      };
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
  }
  return { weeks: [], pending: true };
}

export async function fetchContributorStats(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{ contributors: Contributor[]; pending: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await octokit.rest.repos.getContributorsStats({ owner, repo });
    if (res.status === 200 && Array.isArray(res.data)) {
      const contributors = res.data
        .filter((c) => c.author)
        .map((c) => ({
          login: c.author!.login ?? "unknown",
          avatarUrl: c.author!.avatar_url ?? "",
          contributions: c.total,
        }))
        .sort((a, b) => b.contributions - a.contributions);
      return { contributors, pending: false };
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
  }
  return { contributors: [], pending: true };
}

export async function fetchLanguages(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<LanguageBreakdown[]> {
  const { data } = await octokit.rest.repos.listLanguages({ owner, repo });
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(data)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: (bytes / total) * 100,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

export async function fetchBranches(
  octokit: Octokit,
  owner: string,
  repo: string,
  defaultBranch: string
): Promise<BranchInfo> {
  const { data, headers } = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });
  let total = data.length;
  const linkHeader = headers.link;
  const truncated = !!linkHeader && linkHeader.includes('rel="next"');
  if (truncated) {
    const lastPageMatch = linkHeader?.match(/[?&]page=(\d+)>; rel="last"/);
    if (lastPageMatch) {
      total = (parseInt(lastPageMatch[1], 10) - 1) * 100 + data.length;
    }
  }
  return {
    total,
    truncated,
    defaultBranch,
    names: data.slice(0, 15).map((b) => b.name),
  };
}

async function searchCount(
  octokit: Octokit,
  query: string
): Promise<number> {
  try {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: query,
      per_page: 1,
    });
    return data.total_count;
  } catch {
    return 0;
  }
}

export async function fetchPullRequestStats(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<PullRequestStats> {
  const base = `repo:${owner}/${repo} is:pr`;
  const [open, merged, closedTotal] = await Promise.all([
    searchCount(octokit, `${base} is:open`),
    searchCount(octokit, `${base} is:merged`),
    searchCount(octokit, `${base} is:closed`),
  ]);
  const closedUnmerged = Math.max(0, closedTotal - merged);

  let avgMergeTimeHours: number | null = null;
  let sampleSize = 0;
  try {
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "closed",
      per_page: 30,
      sort: "updated",
      direction: "desc",
    });
    const durations = data
      .filter((pr) => pr.merged_at)
      .map(
        (pr) =>
          (new Date(pr.merged_at!).getTime() -
            new Date(pr.created_at).getTime()) /
          36e5
      );
    if (durations.length > 0) {
      avgMergeTimeHours =
        durations.reduce((a, b) => a + b, 0) / durations.length;
      sampleSize = durations.length;
    }
  } catch {
    // leave as null if inaccessible
  }

  return { open, merged, closedUnmerged, avgMergeTimeHours, sampleSize };
}

export async function fetchIssueStats(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<IssueStats> {
  const base = `repo:${owner}/${repo} is:issue`;
  const [open, closed] = await Promise.all([
    searchCount(octokit, `${base} is:open`),
    searchCount(octokit, `${base} is:closed`),
  ]);

  let avgCloseTimeHours: number | null = null;
  let sampleSize = 0;
  try {
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "closed",
      per_page: 30,
      sort: "updated",
      direction: "desc",
    });
    const durations = data
      .filter((issue) => issue.closed_at && !issue.pull_request)
      .map(
        (issue) =>
          (new Date(issue.closed_at!).getTime() -
            new Date(issue.created_at).getTime()) /
          36e5
      );
    if (durations.length > 0) {
      avgCloseTimeHours =
        durations.reduce((a, b) => a + b, 0) / durations.length;
      sampleSize = durations.length;
    }
  } catch {
    // leave as null if inaccessible
  }

  return { open, closed, avgCloseTimeHours, sampleSize };
}

export { getOctokit, handleOctokitError };
