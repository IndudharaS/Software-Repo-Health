"use client";

import dynamic from "next/dynamic";
import { Loader2, Boxes } from "lucide-react";
import type { DependencyGraphData } from "@/lib/types";

const DependencyGraph3D = dynamic(
  () => import("./DependencyGraph3D").then((m) => m.DependencyGraph3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-border bg-black/20">
        <Loader2 className="size-6 animate-spin text-accent" />
      </div>
    ),
  }
);

export function DependencyGraphSection({
  repoLabel,
  data,
}: {
  repoLabel: string;
  data: DependencyGraphData;
}) {
  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Boxes className="size-4 text-muted" />
        <h3 className="font-medium">Dependency graph</h3>
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          3D
        </span>
      </div>
      {data.dependencies.length === 0 ? (
        <div className="flex h-[420px] items-center justify-center px-6 text-center text-sm text-muted">
          No dependency manifest found via GitHub&apos;s dependency graph for
          this repo (or it hasn&apos;t been indexed by GitHub yet).
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            Direct dependencies declared in{" "}
            <span className="font-mono">{data.manifestFilename}</span>
            {data.totalInManifest > data.dependencies.length &&
              ` (showing ${data.dependencies.length} of ${data.totalInManifest})`}
            , from GitHub&apos;s own dependency graph.
          </p>
          <DependencyGraph3D repoLabel={repoLabel} dependencies={data.dependencies} />
        </>
      )}
    </div>
  );
}
