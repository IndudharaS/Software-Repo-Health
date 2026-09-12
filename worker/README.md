# Arcan deep-scan worker

A separate service that runs the real [Arcan 2 CLI](https://github.com/Arcan-Tech/arcan-2-cli-trial)
against a cloned GitHub repo to detect architectural smells (Cyclic
Dependency, God Component, Hub-Like Dependency, Unstable Dependency). This
does **not** run on Vercel — it needs Docker, Java 17+, and minutes of
compute per scan, so it's deployed as its own always-on service that the
main Next.js app calls over HTTP.

Java repos only for now. No build step is required — Arcan 2 analyzes
source directly, so this only needs `git clone`, not `mvn`/`gradle`.

## How it works

- `POST /scan {repoUrl, sizeKb}` clones the repo (shallow, depth 1), runs
  `arcan.sh analyze -i <repo> -o <out> -l JAVA --all --remote <repoUrl>`,
  and best-effort parses whatever ends up in the output directory into a
  `smells` array — plus the raw file listing regardless, so the caller
  always has something to show.
- Jobs run **one at a time** (analysis is CPU/memory heavy) via an in-memory
  queue. `GET /scan/:id` polls status (`queued` → `running` → `done`/`error`).
- Each job gets its own temp directory, deleted after it finishes
  (success or failure) so disk doesn't grow unbounded.

**Important caveat:** Arcan 2's exact output file/JSON schema isn't publicly
documented (the vendor docs point to their own dashboard product for
interpreting results, not the raw files). The parser in `index.js`
(`collectResult`) is a best-effort heuristic — it looks for JSON/CSV files
under the output directory whose fields resemble a smell record. Run one
real scan after deploying and inspect `result.rawFiles` / `result.outputFiles`
in the response; if the heuristic misses real fields, adjust
`extractSmellsFromJson`/`extractSmellsFromCsv` in `index.js` to match what
Arcan actually produces.

## Deploying to Fly.io

1. [Install the Fly CLI](https://fly.io/docs/flyctl/install/) and
   `fly auth login`.
2. From this directory:

   ```bash
   fly launch --no-deploy   # creates/adjusts fly.toml, pick a unique app name
   fly volumes create arcan_data --size 3   # 3GB scratch disk for clones
   fly deploy
   ```

3. (Optional but recommended) protect the worker so randoms on the internet
   can't queue scans directly on your machine:

   ```bash
   fly secrets set WORKER_AUTH_TOKEN=$(openssl rand -hex 32)
   ```

   Then set the same value as `ARCAN_WORKER_TOKEN` in the main app's Vercel
   env vars (see the root README).

4. Note the deployed URL (`https://<app-name>.fly.dev`) and set it as
   `ARCAN_WORKER_URL` in the main app's environment.

## Costs & limits to know about

- `shared-cpu-2x` / 2GB in `fly.toml` is a starting point, not a
  guaranteed-free tier — check current Fly.io pricing before deploying.
  `min_machines_running = 0` lets the machine scale to zero and stop
  billing between scans, at the cost of a cold start (~seconds) on the
  next request.
- `MAX_REPO_SIZE_KB` (env var, default 300MB) rejects very large repos
  before cloning. `ANALYZE_TIMEOUT_MS` (default 5 min) kills a stuck
  analysis. Tune both via Fly secrets/env if needed.
- This clones and statically analyzes arbitrary public repos. It does
  **not** run `mvn`/`gradle`/build scripts (Arcan 2 parses source directly),
  which avoids the arbitrary-code-execution risk a full build would carry —
  but it's still worth keeping `WORKER_AUTH_TOKEN` set so only your own
  frontend can queue jobs.

## Local testing

```bash
docker build -t arcan-worker .
docker run --rm -p 8080:8080 -v arcan_data:/data arcan-worker
curl -X POST localhost:8080/scan -H 'content-type: application/json' \
  -d '{"repoUrl":"https://github.com/antlr/antlr4"}'
curl localhost:8080/scan/<jobId-from-above>
```
