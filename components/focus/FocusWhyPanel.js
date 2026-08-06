"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, HelpCircle, X } from "lucide-react";
import { useWorkload } from "@/context/WorkloadContext";
import { getExplainabilityReasons } from "@/lib/adaptationSummary";
import { WORKLOAD_LEVELS } from "@/lib/constants";

/**
 * Transparent "Why?" explanation for Focus Mode adaptation.
 */
export default function FocusWhyPanel({ open, onClose }) {
  const { metrics, level, forcedLevel } = useWorkload();
  const effective = forcedLevel || level;
  const reasons = getExplainabilityReasons(
    metrics,
    effective === WORKLOAD_LEVELS.HIGH ? WORKLOAD_LEVELS.HIGH : effective,
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="focus-why-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-3xl border border-[var(--border)] bg-white px-5 py-5 shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                </div>
                <h2
                  id="focus-why-title"
                  className="text-sm font-semibold text-[var(--text-primary)]"
                >
                  Estimated from
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Close explanation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="mt-4 space-y-2.5">
              {reasons.map((reason) => (
                <li
                  key={reason.id}
                  className="flex items-start gap-2 text-sm text-[var(--text-primary)]"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  {reason.label}
                </li>
              ))}
            </ul>

            <p className="mt-4 rounded-2xl bg-[var(--surface-muted)] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              No personal or medical data is collected. This estimate comes from
              observable interaction patterns only.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
