"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FlaskConical } from "lucide-react";
import { useWorkload } from "@/context/WorkloadContext";
import { usePrefs } from "@/context/PrefsContext";
import { WORKLOAD_LABELS, WORKLOAD_UI_TITLE } from "@/lib/constants";
import { ESTIMATOR_THRESHOLDS } from "@/lib/workloadEstimator";
import { resolveEstimatorConfig } from "@/lib/typingBaseline";
import Card from "@/components/ui/Card";

/**
 * Collapsible research instrumentation panel for viva / evaluation demos.
 * Explains behaviour metrics without claiming medical diagnosis.
 */
export default function ResearchPanel() {
  const [open, setOpen] = useState(false);
  const {
    metrics,
    level,
    score,
    confidence,
    signals,
    insufficientData,
    isDemoOverride,
    focusMode,
    previewWellness,
    wellnessTriggerMs,
  } = useWorkload();
  const { prefs } = usePrefs();
  const estimator = resolveEstimatorConfig(prefs.typingBaseline);
  const t = estimator.thresholds;
  const backspaceWeightPct = Math.round(estimator.weights.backspace * 100);

  return (
    <Card className="mt-4" padding={false}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="research-panel-content"
      >
        <div className="flex items-center gap-2">
          <FlaskConical
            className="h-3.5 w-3.5 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Research instrumentation
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </button>

      {open ? (
        <div
          id="research-panel-content"
          className="border-t border-[var(--border)] px-5 py-4"
        >
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Mindflow estimates behavioural workload from typing interaction. It
            does not diagnose medical stress. Labels use &ldquo;{WORKLOAD_UI_TITLE}
            &rdquo; and &ldquo;Behaviour Estimate&rdquo; only.
          </p>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Typing speed"
              value={`${metrics.wpm} WPM`}
            />
            <Metric
              label="Avg pause"
              value={`${metrics.avgPauseMs} ms`}
            />
            <Metric
              label="Backspace rate"
              value={`${Math.round(metrics.backspaceRate * 100)}%`}
            />
            <Metric
              label="Consistency"
              value={metrics.consistency.toFixed(2)}
            />
            <Metric
              label={WORKLOAD_UI_TITLE}
              value={WORKLOAD_LABELS[level]}
            />
            <Metric
              label="Load score"
              value={score.toFixed(2)}
            />
            <Metric
              label="Confidence"
              value={
                insufficientData
                  ? "Warming up"
                  : `${Math.round(confidence * 100)}%`
              }
            />
            <Metric
              label="Mode"
              value={
                isDemoOverride
                  ? "Demo override"
                  : focusMode
                    ? "Priority Focus"
                    : "Adaptive"
              }
            />
          </dl>

          {signals ? (
            <div className="mt-4">
              <p className="text-xs font-medium text-[var(--text-primary)]">
                Signal contributions (0 = calm, 1 = high load)
              </p>
              <ul className="mt-2 grid gap-1 text-xs text-[var(--text-secondary)] sm:grid-cols-2">
                <li>WPM signal: {signals.wpmScore?.toFixed(2)}</li>
                <li>Pause signal: {signals.pauseScore?.toFixed(2)}</li>
                <li>
                  Backspace signal: {signals.backspaceScore?.toFixed(2)}
                </li>
                <li>
                  Consistency signal: {signals.consistencyScore?.toFixed(2)}
                </li>
              </ul>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">
              Key thresholds
            </p>
            <p className="mt-1">
              Calm WPM ≥ {t.calmWpmMin}; High WPM ≤ {t.highWpmMax}; High
              pause ≥ {t.highPauseMinMs}ms; High backspace ≥{" "}
              {Math.round(t.highBackspaceMin * 100)}%; backspace weight{" "}
              {backspaceWeightPct}%
              {prefs.typingBaseline ? " (personalised)" : ""}; min events{" "}
              {ESTIMATOR_THRESHOLDS.minEvents}.
            </p>
            <p className="mt-2">
              Graduated response: High load → Focus Mode immediately; Focus Reset
              after {Math.round((wellnessTriggerMs || 0) / 60000)} minutes of
              sustained high estimate (unless muted / snoozed).
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={previewWellness}
              className="inline-flex h-9 items-center rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-medium text-[var(--text-primary)] shadow-sm transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Preview Focus Reset (viva demo)
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">
        {value}
      </dd>
    </div>
  );
}
