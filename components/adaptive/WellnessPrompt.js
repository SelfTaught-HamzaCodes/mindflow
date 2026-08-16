"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useWorkload } from "@/context/WorkloadContext";
import Button from "@/components/ui/Button";
import BreathingCircle from "@/components/adaptive/BreathingCircle";

/**
 * Focus Reset after sustained High: breathing only.
 */
export default function WellnessPrompt() {
  const { wellnessVisible, dismissWellness } = useWorkload();

  return (
    <AnimatePresence>
      {wellnessVisible ? (
        <WellnessDialog
          key="wellness-dialog"
          onDismiss={dismissWellness}
        />
      ) : null}
    </AnimatePresence>
  );
}

function WellnessDialog({ onDismiss }) {
  function close() {
    onDismiss({ acceptedReset: true });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wellness-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xs rounded-3xl border border-[var(--border)] bg-white px-5 py-5 shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="wellness-title"
            className="text-base font-semibold tracking-tight text-[var(--text-primary)]"
          >
            Focus Reset
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close Focus Reset"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3">
          <BreathingCircle size="lg" active showTiming />
        </div>

        <Button className="mt-4 w-full" onClick={close}>
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}
