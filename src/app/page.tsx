"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import type { RepoAnalysis } from "@/lib/types";

const LOADING_STEPS = [
  "Fetching repository metadata…",
  "Analyzing commit history…",
  "Counting pull requests & issues…",
  "Computing health score…",
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [step, setStep] = useState(0);

  async function handleSubmit(url: string) {
    setLoading(true);
    setError(null);
    setStep(0);

    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 1200);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setAnalysis(data);
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <AnimatePresence mode="wait">
        {analysis ? (
          <Dashboard
            key="dashboard"
            analysis={analysis}
            onReset={() => setAnalysis(null)}
          />
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
          >
            <Loader2 className="size-8 animate-spin text-accent" />
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-muted"
              >
                {LOADING_STEPS[step]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        ) : (
          <Hero key="hero" onSubmit={handleSubmit} loading={loading} error={error} />
        )}
      </AnimatePresence>
    </div>
  );
}
