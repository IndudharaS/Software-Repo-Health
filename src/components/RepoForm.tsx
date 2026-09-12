"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Terminal, Loader2 } from "lucide-react";

const EXAMPLES = ["facebook/react", "vercel/next.js", "microsoft/vscode"];

export function RepoForm({
  onSubmit,
  loading,
}: {
  onSubmit: (url: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSubmit(value.trim());
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 transition-shadow focus-within:shadow-[0_0_0_1px_var(--accent),0_0_40px_-10px_var(--accent)]">
          <Terminal className="size-5 shrink-0 text-muted" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="github.com/owner/repo"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted focus:outline-none sm:text-lg"
            disabled={loading}
            autoFocus
          />
          <motion.button
            type="submit"
            disabled={loading || !value.trim()}
            whileTap={{ scale: 0.95 }}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 sm:px-5"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Analyze
                <ArrowRight className="size-4" />
              </>
            )}
          </motion.button>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => !loading && onSubmit(ex)}
            className="rounded-full border border-border px-3 py-1 transition-colors hover:border-accent/50 hover:text-foreground disabled:opacity-40"
            disabled={loading}
            type="button"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
