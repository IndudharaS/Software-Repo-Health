"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { STATUS } from "@/lib/chart-colors";
import type { HealthScore } from "@/lib/types";

const GRADE_COLOR: Record<HealthScore["grade"], string> = {
  A: STATUS.good,
  B: STATUS.good,
  C: STATUS.warning,
  D: STATUS.serious,
  F: STATUS.critical,
};

const SIZE = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({ score }: { score: HealthScore }) {
  const color = GRADE_COLOR[score.grade];
  const [displayValue, setDisplayValue] = useState(0);
  const progress = useMotionValue(0);
  const dashOffset = useTransform(
    progress,
    (v) => CIRCUMFERENCE - (v / 100) * CIRCUMFERENCE
  );

  useEffect(() => {
    const controls = animate(progress, score.total, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [score.total, progress]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-semibold tabular-nums">
            {displayValue}
          </span>
          <span className="text-xs text-muted">out of 100</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="flex size-7 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {score.grade}
        </span>
        <span className="text-sm font-medium">{score.gradeLabel}</span>
      </div>
    </div>
  );
}
