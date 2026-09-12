# Repo Health

Paste a GitHub repository URL and get an instant health report: commit
activity, contributor diversity, pull request velocity, issue resolution,
community health files, and a single 0–100 health score.

Built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion,
Recharts, and the GitHub REST API via Octokit.

## How it works

- `POST /api/analyze` takes a GitHub URL, fetches repo metadata, community
  profile, commit/contributor stats, languages, branches, and PR/issue counts
  from the GitHub API, then computes a weighted health score
  (`src/lib/health-score.ts`).
- All GitHub API calls happen server-side using a `GITHUB_TOKEN`, so it never
  reaches the browser and every visitor shares one rate-limit budget.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a GitHub personal access token (Settings → Developer settings →
   Personal access tokens → fine-grained; no special permissions are needed
   for public repos) and copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   Then paste your token as `GITHUB_TOKEN=...`. Without a token, requests are
   limited to 60/hour (shared across everyone using the app); with one, the
   limit is 5,000/hour.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. In the Vercel project's **Settings → Environment Variables**, add
   `GITHUB_TOKEN` with your token value (this is required — without it the
   app will hit rate limits almost immediately once shared).
3. Deploy. No other configuration is needed.

## Notes on the health score

The score (`src/lib/health-score.ts`) weights five categories out of 100:

- **Activity & recency (25):** how recently the repo was pushed to, and how
  many of the last 52 weeks had at least one commit.
- **Community health (20):** GitHub's own community profile percentage
  (README, license, contributing guide, code of conduct, issue/PR templates).
- **Pull request velocity (20):** merge rate and average time-to-merge over
  the most recent closed PRs.
- **Issue resolution (15):** close rate and average time-to-close over the
  most recent closed issues.
- **Contributor diversity (15):** number of contributors, penalized if one
  person dominates commit volume (bus-factor risk).

Archived repositories are capped at 25 points regardless of the above.
