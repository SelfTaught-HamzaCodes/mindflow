"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Focus } from "lucide-react";
import { useWorkload } from "@/context/WorkloadContext";
import { FOCUS_SHOWN, PANEL_COUNTS } from "@/lib/adaptationSummary";

const DISPLAY_MS = 2800;

/**
 * Short overlay when Focus turns on.
 * Without it, auto-Focus felt invisible in demos — people thought nothing
 * happened. 2.8s is long enough to read, short enough to not annoy.
 */
export default function FocusActivationOverlay() {
  const { focusMode } = useWorkload();
  const [visible, setVisible] = useState(false);
  const prevFocusRef = useRef(focusMode);

  useEffect(() => {
    const wasOff = !prevFocusRef.current;
    prevFocusRef.current = focusMode;

    if (!(focusMode && wasOff)) return undefined;

    setVisible(true);
    const id = setTimeout(() => setVisible(false), DISPLAY_MS);
    return () => clearTimeout(id);
  }, [focusMode]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
          aria-label="Focus Mode activated"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white px-6 py-6 shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center gap-2 text-sky-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
                <Focus className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold tracking-tight">
                Focus Mode Activated
              </p>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              Estimated cognitive load increased based on recent interaction
              behaviour. We&apos;ve reduced visible information from{" "}
              {PANEL_COUNTS.full} panels to {PANEL_COUNTS.focus}.
            </p>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              To reduce information overload
            </p>
            <ul className="mt-2 space-y-2">
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
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
