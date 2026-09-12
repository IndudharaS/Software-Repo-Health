"use client";

import { motion } from "framer-motion";
import type { HealthScore } from "@/lib/types";

export function ScoreBreakdown({ score }: { score: HealthScore }) {
  return (
    <div className="flex-1 space-y-4">
      {score.breakdown.map((item, i) => {
        const pct = (item.score / item.maxScore) * 100;
        return (
          <div key={item.key}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="tabular-nums text-muted">
                {item.score}/{item.maxScore}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
              />
            </div>
            <p className="mt-1 text-xs text-muted">{item.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
