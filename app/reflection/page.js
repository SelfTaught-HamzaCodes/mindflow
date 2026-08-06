"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { useAppData } from "@/context/AppDataContext";
import { useWorkload } from "@/context/WorkloadContext";
import {
  buildResearchMetrics,
  formatFocusDuration,
  loadSessionMetrics,
} from "@/lib/researchMetrics";
import { WORKLOAD_LABELS, WORKSPACE_STATUS_TITLE } from "@/lib/constants";

/**
 * End-of-day interaction summary — behavioural framing only.
 * Pulls session counters so Reflection has something concrete to show even
 * after a short demo (focus activations, delayed notifs, etc).
 */
export default function ReflectionPage() {
  const { emails, tasks, notifications, user } = useAppData();
  const { adaptation, focusMode, level, highLoadStartedAt } = useWorkload();
  const [session, setSession] = useState(() => ({ focusActivations: 0 }));

  useEffect(() => {
    setSession(loadSessionMetrics());
  }, []);

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

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Daily Reflection
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          Today&apos;s Summary
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {firstName}, a workplace interaction overview based on behavioural
          adaptation - not a medical assessment.
        </p>
      </div>

      <Card className="bg-gradient-to-br from-sky-50 via-white to-emerald-50/40">
        <dl className="space-y-4">
          <Row
            label="Average workload"
            value={WORKLOAD_LABELS[level]}
            hint={`Current ${WORKSPACE_STATUS_TITLE.toLowerCase()}`}
          />
          <Row
            label="Focus Mode activated"
            value={`${metrics.focusSessions} time${metrics.focusSessions === 1 ? "" : "s"}`}
          />
          <Row
            label="Low-priority notifications delayed / hidden"
            value={String(
              metrics.notificationsDelayed + metrics.notificationsHidden,
            )}
          />
          <Row
            label="Priority tasks completed"
            value={String(metrics.priorityTasksCompleted)}
          />
          <Row
            label="Emails prioritised"
            value={String(metrics.emailsPrioritised)}
          />
          <Row
            label="Estimated uninterrupted focus"
            value={formatFocusDuration(metrics.estimatedFocusMinutes)}
          />
          <Row
            label="Break suggestions accepted"
            value={String(metrics.breakSuggestionsAccepted)}
          />
          <Row label="Drafts saved adaptively" value={String(metrics.draftsSaved)} />
        </dl>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          How to read this
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-secondary)]">
          <li>Figures reflect sample data plus this session&apos;s adaptive actions.</li>
          <li>No email content is analysed.</li>
          <li>No personal or medical diagnosis is implied.</li>
        </ul>
      </Card>
    </div>
  );
}

function Row({ label, value, hint }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
      <div>
        <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
        {hint ? (
          <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>
        ) : null}
      </div>
      <dd className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
        {value}
      </dd>
    </div>
  );
}
