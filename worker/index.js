"use strict";

// Zero-dependency HTTP server that queues and runs Arcan 2 CLI analyses.
// One job runs at a time — Arcan analysis is CPU/memory heavy and this is
// meant to run on a single small machine (see ../worker/README.md).

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const PORT = process.env.PORT || 8080;
const ARCAN_HOME = process.env.ARCAN_HOME || "/arcan";
const ARCAN_SCRIPT = process.env.ARCAN_SCRIPT || "./arcan.sh";
const WORK_ROOT = process.env.WORK_ROOT || path.join(os.tmpdir(), "arcan-jobs");
const MAX_REPO_SIZE_KB = Number(process.env.MAX_REPO_SIZE_KB || 300_000); // 300MB
const CLONE_TIMEOUT_MS = Number(process.env.CLONE_TIMEOUT_MS || 120_000);
const ANALYZE_TIMEOUT_MS = Number(process.env.ANALYZE_TIMEOUT_MS || 5 * 60_000);
const JOB_TTL_MS = Number(process.env.JOB_TTL_MS || 60 * 60_000);
const MAX_QUEUE_LENGTH = Number(process.env.MAX_QUEUE_LENGTH || 20);
const AUTH_TOKEN = process.env.WORKER_AUTH_TOKEN || null;
const RAW_FILE_MAX_BYTES = 200_000;

/** @type {Map<string, Job>} */
const jobs = new Map();
const queue = [];
let processing = false;

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

function createJob(repoUrl) {
  const id = crypto.randomUUID();
  const job = {
    id,
    repoUrl,
    status: "queued",
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
    error: null,
    result: null,
    logTail: [],
  };
  jobs.set(id, job);
  queue.push(id);
  scheduleProcessing();
  return job;
}

function appendLog(job, chunk) {
  const lines = chunk.toString("utf8").split(/\r?\n/).filter(Boolean);
  job.logTail.push(...lines);
  if (job.logTail.length > 200) job.logTail = job.logTail.slice(-200);
}

function scheduleProcessing() {
  if (processing) return;
  processing = true;
  processNext().finally(() => {
    processing = false;
    if (queue.length > 0) scheduleProcessing();
  });
}

async function processNext() {
  const id = queue.shift();
  if (!id) return;
  const job = jobs.get(id);
  if (!job) return;

  job.status = "running";
  job.startedAt = Date.now();
  const workDir = path.join(WORK_ROOT, job.id);
  const repoDir = path.join(workDir, "repo");
  const outDir = path.join(workDir, "out");

  try {
    await fsp.mkdir(repoDir, { recursive: true });
    await fsp.mkdir(outDir, { recursive: true });

    log(job.id, "cloning", job.repoUrl);
    await run(
      "git",
      ["clone", "--depth", "1", "--single-branch", job.repoUrl, repoDir],
      { timeoutMs: CLONE_TIMEOUT_MS, onOutput: (c) => appendLog(job, c) }
    );

    log(job.id, "analyzing");
    await run(
      ARCAN_SCRIPT,
      [
        "analyze",
        "-i",
        repoDir,
        "-o",
        outDir,
        "-l",
        "JAVA",
        "--all",
        "--remote",
        job.repoUrl,
      ],
      {
        cwd: ARCAN_HOME,
        timeoutMs: ANALYZE_TIMEOUT_MS,
        onOutput: (c) => appendLog(job, c),
      }
    );

    job.result = await collectResult(outDir);
    job.status = "done";
  } catch (err) {
    job.status = "error";
    job.error = err instanceof Error ? err.message : String(err);
    log(job.id, "failed:", job.error);
  } finally {
    job.finishedAt = Date.now();
    fsp.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

function run(cmd, args, { cwd, timeoutMs, onOutput } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (c) => onOutput?.(c));
    child.stderr.on("data", (c) => onOutput?.(c));

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`${cmd} timed out after ${timeoutMs}ms`));
      } else if (code !== 0) {
        reject(new Error(`${cmd} exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

// Arcan 2's exact report schema isn't publicly documented, so this is a
// best-effort reader: it always returns the raw file listing (so the
// frontend has something to show even if structured parsing below misses),
// and additionally tries to flatten anything that looks like a smell record
// out of JSON/CSV output files.
async function collectResult(outDir) {
  const outputFiles = [];
  const rawFiles = {};
  const smells = [];

  async function walk(dir) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(outDir, full);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        outputFiles.push(rel);
        await tryParse(full, rel);
      }
    }
  }

  async function tryParse(full, rel) {
    let stat;
    try {
      stat = await fsp.stat(full);
    } catch {
      return;
    }
    if (stat.size > RAW_FILE_MAX_BYTES) return;

    const ext = path.extname(full).toLowerCase();
    if (ext === ".json") {
      try {
        const text = await fsp.readFile(full, "utf8");
        const parsed = JSON.parse(text);
        rawFiles[rel] = parsed;
        extractSmellsFromJson(parsed, rel);
      } catch {
        // not valid JSON, skip structured parsing
      }
    } else if (ext === ".csv") {
      try {
        const text = await fsp.readFile(full, "utf8");
        rawFiles[rel] = text;
        extractSmellsFromCsv(text, rel);
      } catch {
        // ignore
      }
    } else if ([".txt", ".log", ".graphml", ".xml"].includes(ext)) {
      try {
        rawFiles[rel] = await fsp.readFile(full, "utf8");
      } catch {
        // ignore
      }
    }
  }

  function extractSmellsFromJson(node, sourceFile, depth = 0) {
    if (depth > 6 || node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) extractSmellsFromJson(item, sourceFile, depth + 1);
      return;
    }
    if (typeof node !== "object") return;

    const keys = Object.keys(node).map((k) => k.toLowerCase());
    const looksLikeSmell = keys.some((k) =>
      ["smell", "smelltype", "type", "affectedelements", "component"].includes(k)
    );
    if (looksLikeSmell) {
      smells.push({
        type: pickField(node, ["smellType", "smell", "type", "name"]),
        component: pickField(node, [
          "component",
          "affectedElements",
          "affectedElement",
          "elements",
          "name",
        ]),
        sourceFile,
        raw: node,
      });
    }
    for (const value of Object.values(node)) {
      if (value && typeof value === "object") {
        extractSmellsFromJson(value, sourceFile, depth + 1);
      }
    }
  }

  function extractSmellsFromCsv(text, sourceFile) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const isSmellFile = header.some((h) =>
      ["smell", "smelltype", "type", "component", "affectedelements"].includes(h)
    );
    if (!isSmellFile) return;
    for (const line of lines.slice(1)) {
      const cells = line.split(",");
      const row = {};
      header.forEach((h, i) => (row[h] = cells[i]));
      smells.push({
        type: row.smelltype || row.smell || row.type || null,
        component: row.component || row.affectedelements || null,
        sourceFile,
        raw: row,
      });
    }
  }

  function pickField(obj, candidates) {
    for (const key of Object.keys(obj)) {
      if (candidates.some((c) => c.toLowerCase() === key.toLowerCase())) {
        return obj[key];
      }
    }
    return null;
  }

  await walk(outDir);

  return {
    outputFiles,
    smells: smells.length > 0 ? smells : null,
    rawFiles,
  };
}

function gcJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (job.finishedAt && now - job.finishedAt > JOB_TTL_MS) {
      jobs.delete(id);
    }
  }
}
setInterval(gcJobs, 5 * 60_000);

function isAuthorized(req) {
  if (!AUTH_TOKEN) return true;
  return req.headers.authorization === `Bearer ${AUTH_TOKEN}`;
}

function isPlausibleGitUrl(url) {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(url.trim());
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1_000_000) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function jobToJson(job) {
  const position = job.status === "queued" ? queue.indexOf(job.id) : -1;
  return {
    id: job.id,
    repoUrl: job.repoUrl,
    status: job.status,
    queuePosition: position >= 0 ? position : undefined,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    error: job.error,
    logTail: job.logTail.slice(-30),
    result: job.result,
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, queueLength: queue.length });
    }

    if (!isAuthorized(req)) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }

    if (req.method === "POST" && url.pathname === "/scan") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const repoUrl = String(body.repoUrl || "").trim();
      const sizeKb = Number(body.sizeKb || 0);

      if (!isPlausibleGitUrl(repoUrl)) {
        return sendJson(res, 400, { error: "Provide a valid https://github.com/owner/repo URL." });
      }
      if (sizeKb > MAX_REPO_SIZE_KB) {
        return sendJson(res, 400, {
          error: `Repository is too large for a deep scan (${Math.round(sizeKb / 1024)}MB > ${Math.round(MAX_REPO_SIZE_KB / 1024)}MB limit).`,
        });
      }
      if (queue.length >= MAX_QUEUE_LENGTH) {
        return sendJson(res, 429, { error: "Scan queue is full. Try again shortly." });
      }

      const job = createJob(repoUrl);
      return sendJson(res, 202, jobToJson(job));
    }

    const scanMatch = url.pathname.match(/^\/scan\/([\w-]+)$/);
    if (req.method === "GET" && scanMatch) {
      const job = jobs.get(scanMatch[1]);
      if (!job) return sendJson(res, 404, { error: "Job not found (it may have expired)." });
      return sendJson(res, 200, jobToJson(job));
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    log("request error:", err);
    sendJson(res, 500, { error: "Internal error" });
  }
});

server.listen(PORT, () => log(`arcan worker listening on :${PORT}`));
