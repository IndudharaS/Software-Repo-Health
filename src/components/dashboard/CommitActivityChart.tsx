"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { SEQUENTIAL_BLUE, CHART_CHROME } from "@/lib/chart-colors";
import type { CommitWeek } from "@/lib/types";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <div className="text-muted">
        {new Date(label ?? "").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>
      <div className="mt-0.5 font-medium">{payload[0].value} commits</div>
    </div>
  );
}

export function CommitActivityChart({
  data,
  pending,
}: {
  data: CommitWeek[];
  pending: boolean;
}) {
  const total = data.reduce((a, w) => a + w.total, 0);

  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-medium">Commit activity</h3>
        <span className="text-xs text-muted">last 52 weeks</span>
      </div>
      {pending || data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted">
          {pending
            ? "GitHub is still computing statistics — try again shortly."
            : "No commit history available."}
        </div>
      ) : (
        <>
          <div className="mb-3 text-2xl font-semibold tabular-nums">
            {total.toLocaleString()}
            <span className="ml-2 text-sm font-normal text-muted">
              total commits
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                {/* Card renders this content twice at once when expanded (compact
                    card + overlay), so this id is briefly duplicated in the DOM —
                    harmless since both defs are always visually identical. */}
                <linearGradient id="commitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={SEQUENTIAL_BLUE[400]}
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor={SEQUENTIAL_BLUE[400]}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={CHART_CHROME.gridline}
                vertical={false}
              />
              <XAxis
                dataKey="weekStart"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString(undefined, { month: "short" })
                }
                stroke={CHART_CHROME.axis}
                tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                stroke={CHART_CHROME.axis}
                tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: CHART_CHROME.axis }} />
              <Area
                type="monotone"
                dataKey="total"
                stroke={SEQUENTIAL_BLUE[400]}
                strokeWidth={2}
                fill="url(#commitFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  );
}
