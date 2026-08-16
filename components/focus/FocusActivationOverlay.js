"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Focus, X } from "lucide-react";
import { useWorkload } from "@/context/WorkloadContext";
import { FOCUS_SHOWN, PANEL_COUNTS } from "@/lib/adaptationSummary";
import Button from "@/components/ui/Button";

/**
 * Overlay when Focus turns on (Elevated → High).
 * Stays up until the user dismisses it — auto-hide made the change easy to miss.
 */
export default function FocusActivationOverlay() {
  const { focusMode } = useWorkload();
  const [visible, setVisible] = useState(false);
  const prevFocusRef = useRef(focusMode);

  useEffect(() => {
    const wasOff = !prevFocusRef.current;
    prevFocusRef.current = focusMode;

    if (focusMode && wasOff) {
      setVisible(true);
    }
    if (!focusMode) {
      setVisible(false);
    }
  }, [focusMode]);

  function dismiss() {
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="focus-activation-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white px-6 py-6 shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-sky-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
                  <Focus className="h-4 w-4" aria-hidden="true" />
                </div>
                <p
                  id="focus-activation-title"
                  className="text-sm font-semibold tracking-tight"
                >
                  Focus Mode on
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Dismiss Focus Mode notice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              Estimated load increased from recent interaction. Visible panels
              went from {PANEL_COUNTS.full} to {PANEL_COUNTS.focus}.
            </p>

            <ul className="mt-4 space-y-2">
              {FOCUS_SHOWN.map((label) => (
                <li
                  key={label}
                  className="flex items-start gap-2 text-sm text-[var(--text-primary)]"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  {label}
                </li>
              ))}
            </ul>

            <Button className="mt-5 w-full" onClick={dismiss}>
              Got it
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
