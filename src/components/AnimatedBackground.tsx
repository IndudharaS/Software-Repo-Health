"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function AnimatedBackground() {
  const { scrollY } = useScroll();

  const gridRotate = useTransform(scrollY, [0, 900], [0, 5]);
  const gridY = useTransform(scrollY, [0, 900], [0, -30]);

  const parallax1 = useTransform(scrollY, [0, 1200], [0, -140]);
  const parallax2 = useTransform(scrollY, [0, 1200], [0, -70]);
  const parallax3 = useTransform(scrollY, [0, 1200], [0, -200]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <motion.div
        className="absolute inset-0 grid-fade"
        style={{ rotateX: gridRotate, y: gridY, transformPerspective: 1200 }}
      />

      <motion.div
        className="absolute -top-40 left-1/4 h-[32rem] w-[32rem]"
        style={{ y: parallax1 }}
      >
        <motion.div
          className="h-full w-full rounded-full bg-accent/25 blur-[120px]"
          animate={{ x: [0, 60, -40, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div
        className="absolute top-1/3 right-1/5 h-[26rem] w-[26rem]"
        style={{ y: parallax2 }}
      >
        <motion.div
          className="h-full w-full rounded-full bg-accent-2/20 blur-[120px]"
          animate={{ x: [0, -50, 30, 0], y: [0, 30, 60, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem]"
        style={{ y: parallax3 }}
      >
        <motion.div
          className="h-full w-full rounded-full bg-fuchsia-500/10 blur-[130px]"
          animate={{ x: [0, 40, -30, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
