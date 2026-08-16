"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Keyboard,
} from "lucide-react";
import { useWorkload } from "@/context/WorkloadContext";
import { usePrefs } from "@/context/PrefsContext";
import {
  WORKLOAD_LABELS,
  WORKSPACE_STATUS_TITLE,
  WORKLOAD_LEVELS,
} from "@/lib/constants";
import { getBehaviourReasons } from "@/lib/adaptationSummary";
import Card from "@/components/ui/Card";

/**
 * Live Workspace Status card.
 * Surfaces the estimate + directional reasons so the adaptation isnt a black
 * box — examiners kept asking "but why did it go High?" during pilots.
 */

const STATE_STYLES = {
  [WORKLOAD_LEVELS.CALM]: {
    ring: "from-sky-100 to-emerald-50",
    glow: "bg-sky-400/20",
    bar: "bg-sky-500",
    tone: "calm",
    hint: "No sustained high workload detected. Standard workspace remains active.",
  },
  [WORKLOAD_LEVELS.NEUTRAL]: {
    ring: "from-amber-50 to-orange-50",
    glow: "bg-amber-400/20",
    bar: "bg-amber-500",
    tone: "warning",
    hint: "Recent typing behaviour is consistent with a moderate workload. Priority items have been lightly emphasised.",
  },
  [WORKLOAD_LEVELS.HIGH]: {
    ring: "from-orange-50 to-rose-50",
    glow: "bg-orange-400/25",
    bar: "bg-orange-500",
    tone: "high",
    hint: "Recent interaction patterns suggest sustained demand. Secondary surfaces are simplified so priorities stay visible.",
  },
};

const ESTIMATE_SOURCES = [
  "Typing speed",
  "Typing pauses",
  "Correction frequency",
  "Session interaction volume",
];

/**
 * Workspace Status widget - behaviour-based estimate, never medical.
 */
export default function BehaviourStatusWidget() {
  const {
    metrics,
    level,
    score,
    confidence,
    insufficientData,
    isDemoOverride,
  } = useWorkload();
  const { prefs } = usePrefs();
  const [methodOpen, setMethodOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const style = STATE_STYLES[level] || STATE_STYLES[WORKLOAD_LEVELS.NEUTRAL];
  const confidencePct = Math.round(confidence * 100);
  const loadPct = Math.round(score * 100);
  const reasons = getBehaviourReasons(metrics, level, prefs.typingBaseline);

  return (
    <Card className="overflow-hidden" padding={false}>
      <div className={`bg-gradient-to-br ${style.ring} px-4 py-3 sm:px-5`}>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-xl"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <motion.span
                className={`absolute inset-0 rounded-xl ${style.glow}`}
                animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.9, 0.55] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-[var(--shadow-sm)] text-[var(--text-primary)]">
                <Activity className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {WORKSPACE_STATUS_TITLE}
              </p>
              <h2 className="truncate text-base font-semibold tracking-tight text-[var(--text-primary)]">
                {WORKLOAD_LABELS[level]}
                <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                  {isDemoOverride
                    ? "Demo"
                    : insufficientData
                      ? "Learning…"
                      : "Live"}
                </span>
              </h2>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="status-details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {reasons.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Behaviour signals">
                  {reasons.map((reason) => (
                    <li
                      key={reason.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-sm"
                    >
                      {reason.direction === "up" ? (
                        <ArrowUp
                          className="h-3.5 w-3.5 text-orange-600"
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowDown
                          className="h-3.5 w-3.5 text-sky-600"
                          aria-hidden="true"
                        />
                      )}
                      <span>
                        {reason.label}{" "}
                        <span className="text-[var(--text-muted)]">
                          {reason.direction === "up" ? "↑" : "↓"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ScoreMeter
                  label="Workload estimate"
                  value={`${loadPct}%`}
                  fill={loadPct}
                  barClass={style.bar}
                  caption="Lower is calmer · higher suggests more demand"
                />
                <ScoreMeter
                  label="Confidence"
                  value={
                    insufficientData ? "Collecting…" : `${confidencePct}%`
                  }
                  fill={confidencePct}
                  barClass="bg-[var(--accent)]"
                  caption={
                    insufficientData
                      ? "Learning your interaction pattern…"
                      : "Collecting interaction data"
                  }
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="status-footer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm text-[var(--text-secondary)]">{style.hint}</p>

              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <button
                  type="button"
                  onClick={() => setMethodOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
                  aria-expanded={methodOpen}
                >
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    Behaviour Estimate
                  </span>
                  {methodOpen ? (
                    <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {methodOpen ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded-2xl bg-[var(--surface-muted)] px-3 py-3">
                        <p className="text-xs text-[var(--text-secondary)]">
                          Derived from:
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {ESTIMATE_SOURCES.map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2 text-xs text-[var(--text-primary)]"
                            >
                              <Check
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                                aria-hidden="true"
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
                          No email content is analysed. No personal or medical data is
                          collected.
                        </p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
                  Type in Compose to update the live estimate
                </p>
                <Link
                  href="/compose"
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-medium text-[var(--text-primary)] shadow-sm transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  Open Compose
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

function ScoreMeter({ label, value, fill, barClass, caption }) {
  return (
    <div className="rounded-2xl bg-white/80 px-3 py-3 shadow-[var(--shadow-sm)] backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(100, fill))}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">{caption}</p>
    </div>
  );
}
