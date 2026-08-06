"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Shield } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAppData } from "@/context/AppDataContext";
import { useWorkload } from "@/context/WorkloadContext";
import {
  buildResearchMetrics,
  formatFocusDuration,
  loadSessionMetrics,
} from "@/lib/researchMetrics";
import { WORKLOAD_LABELS } from "@/lib/constants";

function StateBar({ label, filled, total = 8, active }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-3.5 rounded-sm ${
              i < filled
                ? active
                  ? "bg-[var(--accent)]"
                  : "bg-[var(--border-strong)]"
                : "bg-[var(--surface-muted)]"
            }`}
          />
        ))}
      </div>
      <span
        className={`text-xs ${
          active
            ? "font-semibold text-[var(--text-primary)]"
            : "text-[var(--text-muted)]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

const TIMELINE_PREVIEW = 4;

export default function BehaviourInsightsPage() {
  const { emails, tasks, notifications } = useAppData();
  const { adaptation, focusMode, level, highLoadStartedAt } = useWorkload();
  const [session, setSession] = useState(() => ({ focusActivations: 0 }));
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  useEffect(() => {
    setSession(loadSessionMetrics());
    const id = setInterval(() => setSession(loadSessionMetrics()), 2000);
    return () => clearInterval(id);
  }, []);

  const hidden = !adaptation.showAnalytics || focusMode;
  const metrics = buildResearchMetrics({
    emails,
    tasks,
    notifications,
    adaptation,
    level,
    focusMode,
    session,
    highLoadStartedAt,
  });

  const currentLabel = focusMode
    ? "Focus Mode"
    : WORKLOAD_LABELS[level] || "Calm";

  if (hidden) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Behaviour Insights
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Adaptive behaviour metrics for the research prototype.
          </p>
        </div>
        <Card className="border-orange-100 bg-orange-50/60">
          <p className="text-sm font-medium text-orange-950">
            Behaviour Insights are hidden while Workspace Status is High or Focus
            Mode is active.
          </p>
          <p className="mt-1 text-xs text-orange-900/80">
            This is an intentional interface simplification based on recent
            interaction behaviour.
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button size="sm" variant="secondary">
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          Behaviour Insights
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          How interaction behaviour shaped the workspace today - not generic
          business analytics.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Today&apos;s Workspace States
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Current state: {currentLabel}
          </p>

          <div className="mt-4 space-y-2.5">
            <StateBar
              label="Calm"
              filled={metrics.workloadBars.calm}
              active={!focusMode && level === "calm"}
            />
            <StateBar
              label="Elevated"
              filled={metrics.workloadBars.elevated}
              active={!focusMode && level === "neutral"}
            />
            <StateBar
              label="High"
              filled={metrics.workloadBars.high}
              active={focusMode || level === "high"}
            />
          </div>

          <ol className="mt-5 space-y-2 border-t border-[var(--border)] pt-4">
            {(timelineExpanded
              ? metrics.timelineRows
              : metrics.timelineRows.slice(-TIMELINE_PREVIEW)
            ).map((row, index) => (
              <li
                key={`${row.time}-${row.label}-${index}`}
                className="flex items-center gap-3 text-sm"
              >
                <span className="w-12 shrink-0 font-medium tabular-nums text-[var(--text-muted)]">
                  {row.time}
                </span>
                <span className="text-[var(--text-primary)]">{row.label}</span>
              </li>
            ))}
          </ol>
          {metrics.timelineRows.length > TIMELINE_PREVIEW ? (
            <button
              type="button"
              onClick={() => setTimelineExpanded((v) => !v)}
              className="mt-3 text-xs font-medium text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {timelineExpanded
                ? "Show fewer"
                : `Show earlier (${metrics.timelineRows.length - TIMELINE_PREVIEW} more)`}
            </button>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Adaptation outcomes
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Metric
              label="Focus Mode activations"
              value={metrics.focusSessions}
            />
            <Metric
              label="Priority emails surfaced"
              value={metrics.emailsPrioritised}
            />
            <Metric
              label="Notifications deferred"
              value={metrics.notificationsDelayed}
            />
            <Metric
              label="Wellness prompts accepted"
              value={metrics.breakSuggestionsAccepted}
            />
            <Metric label="Draft recoveries" value={metrics.draftsSaved} />
            <Metric
              label="Low-priority emails hidden"
              value={metrics.emailsHidden}
            />
          </dl>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Focus continuity
          </h2>
          <dl className="mt-4 space-y-3">
            <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
              <dt className="text-xs text-[var(--text-muted)]">
                Estimated uninterrupted focus
              </dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                {formatFocusDuration(metrics.estimatedFocusMinutes)}
              </dd>
            </div>
            <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
              <dt className="text-xs text-[var(--text-muted)]">
                Longest uninterrupted work session
              </dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                {formatFocusDuration(metrics.longestSessionMinutes)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Privacy
            </h2>
          </div>
          <ul className="mt-4 space-y-2">
            {[
              "No email content analysed",
              "Behaviour only",
              "Local browser session",
              "No medical assessment",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Today&apos;s Adaptive Actions
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          What the interface actually did - not only counts.
        </p>
        <ul className="mt-4 space-y-2">
          {metrics.adaptiveActions.map((action) => (
            <li
              key={action}
              className="flex items-start gap-2 text-sm text-[var(--text-primary)]"
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              {action}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border-sky-100 bg-gradient-to-br from-sky-50 to-white">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Daily Reflection
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Today the workspace adapted{" "}
          {Math.max(1, metrics.adaptationsCount)} time
          {metrics.adaptationsCount === 1 ? "" : "s"}. Priority emails remained
          visible while low-priority notifications were delayed.
        </p>
        <Link
          href="/reflection"
          className="mt-4 inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Open Reflection →
        </Link>
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-3">
      <dt className="text-[11px] leading-snug text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
        {value}
      </dd>
    </div>
  );
}
