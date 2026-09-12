"use client";

import dynamic from "next/dynamic";
import { Loader2, Waypoints } from "lucide-react";
import type { Contributor } from "@/lib/types";

const NetworkGraph3D = dynamic(
  () => import("./NetworkGraph3D").then((m) => m.NetworkGraph3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-border bg-black/20">
        <Loader2 className="size-6 animate-spin text-accent" />
      </div>
    ),
  }
);

export function NetworkGraphSection({
  contributors,
  pending,
}: {
  contributors: Contributor[];
  pending: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Waypoints className="size-4 text-muted" />
        <h3 className="font-medium">Contributor network</h3>
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          3D
        </span>
      </div>
      {pending || contributors.length === 0 ? (
        <div className="flex h-[420px] items-center justify-center text-sm text-muted">
          {pending
            ? "GitHub is still computing statistics — try again shortly."
            : "No contributor data available."}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            Each node is a top contributor, sized by commit volume. A line
            connects two contributors who were both active in the same week.
          </p>
          <NetworkGraph3D contributors={contributors} />
        </>
      )}
    </div>
  );
}
