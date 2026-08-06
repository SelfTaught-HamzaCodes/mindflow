"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wind,
  Coffee,
  PersonStanding,
  X,
  HelpCircle,
  Check,
} from "lucide-react";
import { useWorkload } from "@/context/WorkloadContext";
import { useAppData } from "@/context/AppDataContext";
import { getExplainabilityReasons } from "@/lib/adaptationSummary";
import { WORKLOAD_LEVELS } from "@/lib/constants";
import Button from "@/components/ui/Button";
import BreathingCircle from "@/components/adaptive/BreathingCircle";

const STRETCHES = [
  {
    id: "shoulders",
    title: "Shoulder Roll",
    detail: "Roll your shoulders backwards 5 times.",
  },
  {
    id: "look-away",
    title: "Look Away",
    detail: "Focus on something at least 20 feet away for 20 seconds.",
  },
  {
    id: "stand",
    title: "Stand",
    detail: "Stand and stretch your arms above your head for 30 seconds.",
  },
];

/**
 * Focus Reset after sustained High Cognitive Load.
 * Graduated on purpose: Focus Mode first, then this softer prompt.
 * Language is behavioural only — never medical. Easy to dismiss/snooze
 * so it doesnt feel like the system is bossing you around.
 */
export default function WellnessPrompt() {
  const { wellnessVisible, dismissWellness, snoozeWellness } = useWorkload();

  return (
    <AnimatePresence>
      {wellnessVisible ? (
        <WellnessDialog
          key="wellness-dialog"
          onDismiss={dismissWellness}
          onSnooze={snoozeWellness}
        />
      ) : null}
    </AnimatePresence>
  );
}

function WellnessDialog({ onDismiss, onSnooze }) {
  const { user } = useAppData();
  const { metrics, level } = useWorkload();
  const firstName = user?.name?.split(" ")[0] || "there";
  const muteId = useId();
  const breathingRef = useRef(null);

  const [muteToday, setMuteToday] = useState(false);
  const [resetActive, setResetActive] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const reasons = getExplainabilityReasons(metrics, WORKLOAD_LEVELS.HIGH);

  function closeWith(action, extra = {}) {
    action({ muteToday, ...extra });
  }

  function startReset() {
    setResetActive(true);
    requestAnimationFrame(() => {
      breathingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }

  function finishResetAndContinue() {
    closeWith(onDismiss, { acceptedReset: resetActive });
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
      aria-describedby="wellness-desc"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-h-[min(92vh,44rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
      >
        <div className="bg-gradient-to-br from-sky-50 via-white to-emerald-50/40 px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Behaviour Estimate
              </p>
              <h2
                id="wellness-title"
                className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]"
              >
                Focus Reset
              </h2>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {firstName}, you&apos;ve been focused for a while.
              </p>
              <p
                id="wellness-desc"
                className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]"
              >
                Recent interaction patterns suggest you&apos;ve been working under
                sustained cognitive demand. A short reset may help reduce
                information overload and maintain focus.
              </p>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-[var(--text-muted)]">
                This suggestion is based on interaction behaviour and is intended
                to support your workflow. It is not a medical assessment or
                diagnosis.
              </p>
            </div>
            <button
              type="button"
              onClick={finishResetAndContinue}
              className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-white/80 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Close Focus Reset"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <section aria-labelledby="stretch-title">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <PersonStanding className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3
                id="stretch-title"
                className="text-sm font-semibold text-[var(--text-primary)]"
              >
                Stretch
              </h3>
            </div>
            <ul className="grid gap-2 sm:grid-cols-3">
              {STRETCHES.map((tip) => (
                <li
                  key={tip.id}
                  className="rounded-2xl bg-[var(--surface-muted)] px-3 py-2.5"
                >
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                    {tip.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {tip.detail}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section
            ref={breathingRef}
            className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-5"
            aria-labelledby="breathing-title"
          >
            <div className="mb-1 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                <h3
                  id="breathing-title"
                  className="text-sm font-semibold text-[var(--text-primary)]"
                >
                  Breathing Guide
                </h3>
              </div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                ≈ 60 seconds
              </p>
            </div>

            <BreathingCircle
              size="lg"
              active={resetActive}
              showTiming={resetActive}
            />
            {!resetActive ? (
              <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
                Start when you are ready - inhale, hold, exhale, repeat.
              </p>
            ) : null}
          </section>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={startReset}>
              <Wind className="h-4 w-4" aria-hidden="true" />
              {resetActive ? "Reset in progress" : "Start 60-Second Reset"}
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={finishResetAndContinue}
              >
                Continue Working
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => closeWith(onSnooze)}
              >
                <Coffee className="h-4 w-4" aria-hidden="true" />
                Remind Me Later
              </Button>
            </div>
          </div>

          <label
            htmlFor={muteId}
            className="flex cursor-pointer items-start gap-2.5 text-xs text-[var(--text-secondary)]"
          >
            <input
              id={muteId}
              type="checkbox"
              checked={muteToday}
              onChange={(e) => setMuteToday(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-[var(--border-strong)] text-[var(--accent)] focus-visible:ring-[var(--accent)]"
            />
            <span>Don&apos;t suggest another reset today</span>
          </label>

          <div className="border-t border-[var(--border)] pt-3">
            <button
              type="button"
              onClick={() => setWhyOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-expanded={whyOpen}
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Why am I seeing this?
            </button>
            <AnimatePresence>
              {whyOpen ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-2xl bg-[var(--surface-muted)] px-3 py-3">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Recent interaction patterns suggest sustained workload.
                      Estimated from:
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {reasons.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-start gap-2 text-xs text-[var(--text-primary)]"
                        >
                          <Check
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                            aria-hidden="true"
                          />
                          {r.label}
                        </li>
                      ))}
                      <li className="flex items-start gap-2 text-xs text-[var(--text-primary)]">
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        Workload estimate remained high
                      </li>
                    </ul>
                    <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                      No personal or medical data is collected. Current estimate:{" "}
                      {level}.
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
