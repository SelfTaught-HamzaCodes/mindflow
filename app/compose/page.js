"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, PenSquare, Save } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import AnimatedNumber, {
  AnimatedMetricLabel,
} from "@/components/ui/AnimatedNumber";
import { useTypingBehaviour } from "@/hooks/useTypingBehaviour";
import { useWorkload } from "@/context/WorkloadContext";
import { usePrefs } from "@/context/PrefsContext";
import {
  WORKLOAD_LABELS,
  WORKSPACE_STATUS_TITLE,
  WORKLOAD_LEVELS,
} from "@/lib/constants";
import { bumpSessionMetric } from "@/lib/researchMetrics";
import { getExplainabilityReasons } from "@/lib/adaptationSummary";
import { ESTIMATOR_THRESHOLDS } from "@/lib/workloadEstimator";

/**
 * Primary typing capture surface for the behaviour analysis engine.
 * Compose is where the RQ actually gets exercised — type here and watch
 * Workspace Status climb. Draft-save suggestion is a soft nudge when we
 * detect hesistation, not a hard block.
 */
export default function ComposePage() {
  const {
    updateFromMetrics,
    level,
    metrics,
    confidence,
    insufficientData,
    focusMode,
    setFocusMode,
  } = useWorkload();
  const { prefs } = usePrefs();

  const { handleKeyDown, reset, metrics: localMetrics } = useTypingBehaviour({
    onMetricsChange: updateFromMetrics,
  });

  const [draftSaved, setDraftSaved] = useState(false);
  const [suggestDraft, setSuggestDraft] = useState(false);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    updateFromMetrics(localMetrics);
  }, [localMetrics, updateFromMetrics]);

  useEffect(() => {
    // Suggest draft save when load jumps to High OR pauses get long —
    // either signal suggests the user might lose work if they bail
    const becameHigh =
      prevLevelRef.current !== WORKLOAD_LEVELS.HIGH &&
      level === WORKLOAD_LEVELS.HIGH;
    prevLevelRef.current = level;

    const longPause =
      localMetrics.avgPauseMs >= 700 && localMetrics.eventCount >= 8;

    if (!dismissedSuggestion && !draftSaved && (becameHigh || longPause)) {
      setSuggestDraft(true);
    }
  }, [
    level,
    localMetrics.avgPauseMs,
    localMetrics.eventCount,
    dismissedSuggestion,
    draftSaved,
  ]);

  function saveDraft() {
    setDraftSaved(true);
    setSuggestDraft(false);
    bumpSessionMetric("draftsSaved");
  }

  const confidenceLabel = insufficientData
    ? "Building estimate…"
    : confidence >= 0.75
      ? "High"
      : confidence >= 0.4
        ? "Medium"
        : "Low";

  const statusSentence =
    level === WORKLOAD_LEVELS.HIGH
      ? "Focus Mode is available to reduce interface density."
      : level === WORKLOAD_LEVELS.NEUTRAL
        ? "Adaptive suggestions are currently active."
        : "Standard workspace density remains active.";

  const summaryBullets = getExplainabilityReasons(
    metrics,
    level,
    prefs.typingBaseline,
  );
  const summaryLines =
    summaryBullets.length > 0
      ? summaryBullets.map((r) => r.label)
      : insufficientData
        ? ["Waiting for more keystrokes to form a stable estimate"]
        : ["Typing patterns look steady relative to the rule thresholds"];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Compose
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Type in the draft area to drive Interaction Analysis. This is the
            research instrument for behavioural workload estimation.
          </p>
        </div>
        <div className="max-w-sm rounded-2xl border border-[var(--border)] bg-white px-3 py-2 text-xs shadow-sm">
          <p className="font-medium text-[var(--text-primary)]">
            Behaviour estimate: {WORKLOAD_LABELS[level]}
          </p>
          <p className="mt-0.5 text-[var(--text-secondary)]">{statusSentence}</p>
        </div>
      </div>

      <AnimatePresence>
        {suggestDraft ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3"
            role="status"
          >
            <p className="text-sm font-medium text-amber-950">
              {level === WORKLOAD_LEVELS.HIGH
                ? "Estimated workload is high."
                : "Long pause detected."}{" "}
              Would you like to save this as a draft and continue later?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={saveDraft}>
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                Save as draft
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setDismissedSuggestion(true);
                  setSuggestDraft(false);
                }}
              >
                Keep writing
              </Button>
              {level === WORKLOAD_LEVELS.HIGH && !focusMode ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFocusMode(true)}
                >
                  Enable Focus Mode
                </Button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {draftSaved ? (
        <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Draft saved. You can continue later - nothing was sent.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <div className="mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
            <PenSquare className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Draft reply (sample)
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              To
            </span>
            <input
              type="text"
              defaultValue="sarah.mitchell@northwind.co"
              className="mb-3 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              Subject
            </span>
            <input
              type="text"
              defaultValue="Re: Q3 pipeline review - need figures by 4pm"
              className="mb-3 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              Message body
            </span>
            <textarea
              rows={12}
              placeholder="Start typing to update Interaction Analysis…"
              onKeyDown={handleKeyDown}
              className="w-full resize-y rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] shadow-[var(--shadow-sm)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-describedby="compose-help"
            />
          </label>
          <p id="compose-help" className="mt-2 text-xs text-[var(--text-secondary)]">
            Typing behaviour is analysed. Email content is ignored.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            <strong className="font-semibold text-[var(--text-primary)]">
              No email content is analysed.
            </strong>{" "}
            Only interaction behaviour is processed locally to estimate workspace
            workload.
          </p>

          <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] px-3 py-3">
            <p className="text-xs font-medium text-[var(--text-primary)]">
              Research Prototype
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Email sending disabled. This page exists to capture typing behaviour
              for the adaptive interface.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={saveDraft}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save draft
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Reset typing session
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Interaction Analysis
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Rule-based estimate · not a medical diagnosis
                </p>
              </div>
              <Badge
                tone={
                  level === "calm"
                    ? "calm"
                    : level === "high"
                      ? "high"
                      : "warning"
                }
              >
                {WORKSPACE_STATUS_TITLE}: {WORKLOAD_LABELS[level]}
              </Badge>
            </div>

            <dl className="mt-4 space-y-2.5">
              <MetricRow
                label="Words per Minute"
                tip="Measures typing speed from recent keystrokes."
                numeric={metrics.wpm}
              />
              <MetricRow
                label="Average Pause"
                tip="Average delay between keystrokes in the sliding window."
                numeric={metrics.avgPauseMs}
                suffix=" ms"
              />
              <MetricRow
                label="Backspace Rate"
                tip="Frequency of corrections relative to total key events."
                numeric={metrics.backspaceRate * 100}
                suffix="%"
              />
              <MetricRow
                label="Typing Rhythm"
                tip="Variation in the time interval between consecutive keystrokes. Higher means more regular rhythm."
                numeric={metrics.consistency}
                decimals={2}
              />
              <MetricRow
                label="Confidence"
                tip={`Reliability of the current estimate. Needs about ${ESTIMATOR_THRESHOLDS.minEvents} key events before it stabilises.`}
                labelValue={confidenceLabel}
              />
            </dl>

            <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] px-3 py-3">
              <p className="text-xs font-medium text-[var(--text-primary)]">
                Current Behaviour Summary
              </p>
              <ul className="mt-2 space-y-1.5">
                {summaryLines.map((line) => (
                  <li
                    key={line}
                    className="text-xs leading-relaxed text-[var(--text-secondary)]"
                  >
                    • {line}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[var(--text-primary)]">
                Current workspace estimate:{" "}
                <span className="font-semibold">{WORKLOAD_LABELS[level]}</span>
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Analysis pipeline
            </h3>
            <ol className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
              {[
                "Keyboard Input",
                "Feature Extraction",
                "Rule Engine",
                "Behaviour Estimate",
                "Adaptive Interface",
              ].map((step, index, arr) => (
                <li key={step} className="flex flex-col items-start">
                  <span className="rounded-lg bg-[var(--surface-muted)] px-2.5 py-1 font-medium text-[var(--text-primary)]">
                    {step}
                  </span>
                  {index < arr.length - 1 ? (
                    <span className="px-3 py-0.5 text-[var(--text-muted)]" aria-hidden="true">
                      ↓
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  tip,
  numeric,
  decimals = 0,
  suffix = "",
  labelValue,
}) {
  return (
    <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <dt className="flex min-w-0 items-center gap-1 text-xs text-[var(--text-muted)]">
          <span className="truncate">{label}</span>
          <span
            className="inline-flex text-[var(--text-muted)]"
            title={tip}
            aria-label={tip}
          >
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </span>
        </dt>
        <dd className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
          {labelValue != null ? (
            <AnimatedMetricLabel value={labelValue} />
          ) : (
            <AnimatedNumber
              value={numeric}
              decimals={decimals}
              suffix={suffix}
            />
          )}
        </dd>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-[var(--text-muted)]">
        {tip}
      </p>
    </div>
  );
}
