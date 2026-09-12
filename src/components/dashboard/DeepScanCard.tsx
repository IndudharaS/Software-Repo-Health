"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Microscope, Loader2, ChevronDown, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { STATUS } from "@/lib/chart-colors";
import type { DeepScanJob } from "@/lib/types";

const SMELL_DESCRIPTIONS: Record<string, string> = {
  "cyclic dependency":
    "Components involved in a circular chain of dependencies — hard to change one without the others.",
  "god component":
    "A component that's excessively large relative to the rest of the codebase.",
  "hub-like dependency":
    "A component with an unusually large number of incoming and outgoing dependencies.",
  "unstable dependency":
    "A component depends on something less stable than itself, so it inherits that instability.",
};

function describeSmell(type: string | null): string | null {
  if (!type) return null;
  return SMELL_DESCRIPTIONS[type.toLowerCase().trim()] ?? null;
}

export function DeepScanCard({
  repoUrl,
  sizeKb,
  language,
}: {
  repoUrl: string;
  sizeKb: number;
  language: string | null;
}) {
  const [job, setJob] = useState<DeepScanJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function startScan() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/deep-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, sizeKb }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't start the deep scan.");
        setStarting(false);
        return;
      }
      setJob(data);
      pollRef.current = setInterval(() => poll(data.id), 3000);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setStarting(false);
    }
  }

  async function poll(id: string) {
    try {
      const res = await fetch(`/api/deep-scan/${id}`);
      const data: DeepScanJob = await res.json();
      setJob(data);
      if (data.status === "done" || data.status === "error") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      // transient — keep polling
    }
  }

  if (language !== "Java") {
    return (
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <Microscope className="size-4 text-muted" />
          <h3 className="font-medium">Deep architecture scan</h3>
        </div>
        <p className="text-sm text-muted">
          Real architectural-smell detection (via Arcan) currently supports
          Java repositories only. This repo&apos;s dominant language is{" "}
          {language ?? "unknown"}.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <Microscope className="size-4 text-muted" />
        <h3 className="font-medium">Deep architecture scan</h3>
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          Java · Arcan
        </span>
      </div>
      <p className="mb-4 text-sm text-muted">
        Clones the repo and runs{" "}
        <a
          href="https://arcan.tech"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          Arcan
        </a>{" "}
        to detect cyclic dependencies, god components, hub-like dependencies,
        and unstable dependencies. Takes a few minutes.
      </p>

      {!job && (
        <button
          onClick={startScan}
          disabled={starting}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {starting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Microscope className="size-4" />
          )}
          Run deep scan
        </button>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {job && (job.status === "queued" || job.status === "running") && (
        <div className="flex items-center gap-3 text-sm text-muted">
          <Loader2 className="size-4 animate-spin text-accent" />
          {job.status === "queued"
            ? `Queued${job.queuePosition ? ` (position ${job.queuePosition})` : ""}…`
            : "Analyzing source…"}
        </div>
      )}

      {job && job.status === "error" && (
        <div className="mt-1 flex items-start gap-2 text-sm text-red-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{job.error ?? "The scan failed."}</span>
        </div>
      )}

      {job && job.status === "done" && job.result && (
        <div className="space-y-3">
          {job.result.smells && job.result.smells.length > 0 ? (
            <SmellResults smells={job.result.smells} />
          ) : (
            <p className="text-sm text-muted">
              Scan completed — Arcan produced {job.result.outputFiles.length}{" "}
              output file{job.result.outputFiles.length === 1 ? "" : "s"}, but
              none matched our automatic parser (Arcan&apos;s report schema
              isn&apos;t publicly documented). No smells to show automatically.
            </p>
          )}
        </div>
      )}

      {job && job.logTail.length > 0 && job.status !== "done" && (
        <div className="mt-3">
          <button
            onClick={() => setShowLog((s) => !s)}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${showLog ? "rotate-180" : ""}`}
            />
            {showLog ? "Hide log" : "Show log"}
          </button>
          {showLog && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] text-muted">
              {job.logTail.join("\n")}
            </pre>
          )}
        </div>
      )}
    </Card>
  );
}

function SmellResults({
  smells,
}: {
  smells: NonNullable<NonNullable<DeepScanJob["result"]>["smells"]>;
}) {
  const counts = new Map<string, number>();
  for (const s of smells) {
    const key = s.type ?? "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {[...counts.entries()].map(([type, count]) => (
          <span
            key={type}
            className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: STATUS.serious }}
            />
            {type}
            <span className="tabular-nums text-muted">{count}</span>
          </span>
        ))}
      </div>
      <ul className="max-h-60 space-y-2 overflow-auto">
        {smells.slice(0, 50).map((s, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i * 0.02, 0.4) }}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <div className="font-medium">{s.type ?? "Unknown smell"}</div>
            {s.component && (
              <div className="mt-0.5 truncate font-mono text-xs text-muted">
                {s.component}
              </div>
            )}
            {describeSmell(s.type) && (
              <div className="mt-1 text-xs text-muted">{describeSmell(s.type)}</div>
            )}
          </motion.li>
        ))}
      </ul>
      {smells.length > 50 && (
        <p className="mt-2 text-xs text-muted">
          Showing first 50 of {smells.length} smells.
        </p>
      )}
    </div>
  );
}
