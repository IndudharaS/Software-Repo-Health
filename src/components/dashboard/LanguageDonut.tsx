"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import { CATEGORICAL } from "@/lib/chart-colors";
import type { LanguageBreakdown } from "@/lib/types";

const SLOT_COLORS = [CATEGORICAL.blue, CATEGORICAL.orange, CATEGORICAL.aqua];

export function LanguageDonut({
  languages,
}: {
  languages: LanguageBreakdown[];
}) {
  const top = languages.slice(0, 3);
  const restPercent = languages.slice(3).reduce((a, l) => a + l.percent, 0);
  const data = [
    ...top.map((l, i) => ({ name: l.name, percent: l.percent, color: SLOT_COLORS[i] })),
    ...(restPercent > 0.5
      ? [{ name: "Other", percent: restPercent, color: CATEGORICAL.other }]
      : []),
  ];

  if (languages.length === 0) {
    return (
      <Card>
        <h3 className="mb-4 font-medium">Languages</h3>
        <div className="flex h-40 items-center justify-center text-sm text-muted">
          No language data available.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 font-medium">Languages</h3>
      <div className="flex items-center gap-6">
        <div className="h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="percent"
                nameKey="name"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                stroke="var(--surface)"
                strokeWidth={2}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="glass rounded-lg px-3 py-2 text-xs">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-muted">{p.percent.toFixed(1)}%</div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {data.map((d) => (
            <li key={d.name} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="min-w-0 flex-1 truncate">{d.name}</span>
              <span className="shrink-0 tabular-nums text-muted">
                {d.percent.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
