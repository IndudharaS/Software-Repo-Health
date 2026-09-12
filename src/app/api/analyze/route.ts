import { NextResponse } from "next/server";
import {
  parseGitHubUrl,
  getOctokit,
  fetchRepoOverview,
  fetchCommunityHealth,
  fetchCommitActivity,
  fetchContributorStats,
  fetchLanguages,
  fetchBranches,
  fetchBranchActivity,
  fetchDependencyGraph,
  fetchPullRequestStats,
  fetchIssueStats,
  InvalidUrlError,
  RepoNotFoundError,
  RateLimitError,
} from "@/lib/github";
import { computeHealthScore } from "@/lib/health-score";
import type { RepoAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";

class AnalysisTimeoutError extends Error {}

const REQUEST_TIMEOUT_MS = 25000;

async function runAnalysis(owner: string, repo: string): Promise<RepoAnalysis> {
  const octokit = getOctokit();

  const [overview, community, languages] = await Promise.all([
    fetchRepoOverview(octokit, owner, repo),
    fetchCommunityHealth(octokit, owner, repo),
    fetchLanguages(octokit, owner, repo),
  ]);

  const [
    commitActivityResult,
    contributorsResult,
    branches,
    pullRequests,
    issues,
    dependencyGraph,
  ] = await Promise.all([
    fetchCommitActivity(octokit, owner, repo),
    fetchContributorStats(octokit, owner, repo),
    fetchBranches(octokit, owner, repo, overview.defaultBranch),
    fetchPullRequestStats(octokit, owner, repo),
    fetchIssueStats(octokit, owner, repo),
    fetchDependencyGraph(octokit, owner, repo),
  ]);

  const branchActivity = await fetchBranchActivity(
    octokit,
    owner,
    repo,
    branches.names,
    overview.defaultBranch
  );

  const score = computeHealthScore({
    overview,
    community,
    commitActivity: commitActivityResult.weeks,
    contributors: contributorsResult.contributors,
    pullRequests,
    issues,
  });

  return {
    overview,
    community,
    commitActivity: commitActivityResult.weeks,
    contributors: contributorsResult.contributors.slice(0, 10),
    totalContributors: contributorsResult.contributors.length,
    languages,
    pullRequests,
    issues,
    branches,
    branchActivity,
    dependencyGraph,
    score,
    statsPending: commitActivityResult.pending || contributorsResult.pending,
  };
}

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json(
      { error: "Please provide a GitHub repository URL." },
      { status: 400 }
    );
  }

  try {
    const { owner, repo } = parseGitHubUrl(url);

    // GitHub occasionally throttles/slow-walks responses for a repo+token
    // that's been queried a lot in a short window, rather than rejecting
    // outright. Without a hard cap here, that shows up as the whole request
    // hanging for a minute or more instead of failing cleanly.
    const analysis = await Promise.race([
      runAnalysis(owner, repo),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new AnalysisTimeoutError()),
          REQUEST_TIMEOUT_MS
        )
      ),
    ]);

    return NextResponse.json(analysis);
  } catch (err) {
    if (err instanceof InvalidUrlError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof RepoNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof AnalysisTimeoutError) {
      return NextResponse.json(
        {
          error:
            "This is taking longer than expected, likely because GitHub is throttling requests for this repository right now. Please try again in a minute.",
        },
        { status: 504 }
      );
    }
    const status = (err as { status?: number })?.status;
    if (status === 404) {
      return NextResponse.json(
        { error: "Repository not found. Check the URL and make sure it's public." },
        { status: 404 }
      );
    }
    if (status === 403 || status === 429) {
      return NextResponse.json(
        { error: "GitHub API rate limit reached. Please try again in a few minutes." },
        { status: 429 }
      );
    }
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: "Something went wrong while analyzing the repository." },
      { status: 500 }
    );
  }
}
