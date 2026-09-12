"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTilt } from "@/hooks/useTilt";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  /** Tilts on hover and can be clicked to expand into a larger overlay. Default true. */
  expandable?: boolean;
  children?: ReactNode;
}

export function Card({
  className,
  children,
  expandable = true,
  ...props
}: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const { ref, rotateX, rotateY, onPointerMove, onPointerLeave } = useTilt(5);
  const canPortal = typeof document !== "undefined";

  useEffect(() => {
    if (!expanded) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <>
      <motion.div
        ref={expandable ? ref : undefined}
        style={
          expandable ? { rotateX, rotateY, transformPerspective: 800 } : undefined
        }
        onPointerMove={expandable ? onPointerMove : undefined}
        onPointerLeave={expandable ? onPointerLeave : undefined}
        onClick={expandable ? () => setExpanded(true) : undefined}
        whileHover={expandable ? { scale: 1.015 } : undefined}
        whileTap={expandable ? { scale: 0.99 } : undefined}
        className={cn(
          "group glass relative rounded-2xl p-5 sm:p-6",
          expandable && "cursor-pointer",
          className
        )}
        {...props}
      >
        {expandable && (
          <Maximize2 className="pointer-events-none absolute right-4 top-4 size-3.5 text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-70" />
        )}
        {children}
      </motion.div>

      {canPortal &&
        expandable &&
        createPortal(
          <AnimatePresence>
            {expanded && (
              <>
                <motion.div
                  key="backdrop"
                  className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setExpanded(false)}
                />
                <motion.div
                  key="expanded-card"
                  className="glass fixed inset-4 z-50 overflow-auto rounded-2xl p-6 sm:inset-10 sm:p-8 md:inset-16"
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 16 }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                >
                  <button
                    onClick={() => setExpanded(false)}
                    aria-label="Close"
                    className="absolute right-4 top-4 rounded-full p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                  {children}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
