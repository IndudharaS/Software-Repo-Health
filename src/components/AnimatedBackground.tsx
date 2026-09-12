"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 grid-fade" />
      <motion.div
        className="absolute -top-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-[120px]"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, 40, -20, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/5 h-[26rem] w-[26rem] rounded-full bg-accent-2/20 blur-[120px]"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 30, 60, 0],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/10 blur-[130px]"
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
