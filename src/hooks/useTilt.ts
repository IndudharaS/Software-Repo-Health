"use client";

import { useRef } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";
import type { PointerEvent } from "react";

export function useTilt(maxDeg = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const springConfig = { stiffness: 220, damping: 22, mass: 0.4 };
  const rotateX = useSpring(
    useTransform(py, [0, 1], [maxDeg, -maxDeg]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(px, [0, 1], [-maxDeg, maxDeg]),
    springConfig
  );

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function onPointerLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return { ref, rotateX, rotateY, onPointerMove, onPointerLeave };
}
