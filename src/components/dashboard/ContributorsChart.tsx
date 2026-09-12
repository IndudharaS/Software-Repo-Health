"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { SEQUENTIAL_BLUE, CHART_CHROME } from "@/lib/chart-colors";
import type { Contributor } from "@/lib/types";

export function ContributorsChart({
  contributors,
  total,
  pending,
}: {
  contributors: Contributor[];
  total: number;
  pending: boolean;
}) {
  const data = [...contributors].reverse();

  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-medium">Top contributors</h3>
        <span className="text-xs text-muted">
          {total} contributor{total === 1 ? "" : "s"} total
        </span>
      </div>
      {pending || data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-muted">
          {pending
            ? "GitHub is still computing statistics — try again shortly."
            : "No contributor data available."}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 32)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="login"
              width={110}
              tick={{ fill: CHART_CHROME.mutedText, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Contributor;
                return (
                  <div className="glass rounded-lg px-3 py-2 text-xs">
                    <div className="font-medium">{p.login}</div>
                    <div className="text-muted">
                      {p.contributions.toLocaleString()} commits
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="contributions" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={SEQUENTIAL_BLUE[400]}
                  fillOpacity={0.5 + (0.5 * (i + 1)) / data.length}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
