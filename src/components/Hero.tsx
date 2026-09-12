"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { RepoForm } from "./RepoForm";

export function Hero({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (url: string) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5 }}
        className="mb-6 flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs text-muted"
      >
        <Activity className="size-3.5 text-accent-2" />
        Instant open-source health reports
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl"
      >
        Know the health of any{" "}
        <span className="text-gradient">GitHub repository</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-5 max-w-xl text-balance text-muted sm:text-lg"
      >
        Paste a repo URL to see commit activity, contributor diversity, pull
        request velocity, issue resolution, and a single health score — in
        seconds.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-10 flex w-full flex-col items-center"
      >
        <RepoForm onSubmit={onSubmit} loading={loading} />
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
