"use client";

import { useEffect, useState } from "react";
import {
  useWorkload,
  WELLNESS_TRIGGER_MS,
  DEMO_SPEED_OPTIONS,
} from "@/context/WorkloadContext";
import { useAppData } from "@/context/AppDataContext";
import { WORKLOAD_LEVELS, WORKLOAD_LABELS } from "@/lib/constants";
import { formatDuration } from "@/lib/format";

const simBtn =
  "rounded-md border border-[var(--border)] bg-[var(--surface)] px-1 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

/**
 * Compact examiner controls: session clock, speed, workload override, simulate.
 * Lives in the sidebar so demos dont need a seperate "admin" page — examiners
 * can force High mid-walkthrough without leaving the UI.
 */
export default function DemoControls({ collapsed = false }) {
  const {
    forcedLevel,
    setForcedLevel,
    liveLevel,
    demoSpeed,
    setDemoSpeed,
    sessionStartedAt,
    behaviourHighSince,
    previewWellness,
    clearWellnessMute,
    focusResetMuted,
    wellnessVisible,
    level,
  } = useWorkload();
  const {
    injectUrgentEmail,
    injectHighPriorityTask,
    injectNotifications,
  } = useAppData();

  const [tick, setTick] = useState(null);

  useEffect(() => {
    setTick(Date.now());
    const id = setInterval(() => setTick(Date.now()), demoSpeed > 1 ? 200 : 1000);
    return () => clearInterval(id);
  }, [demoSpeed]);

  // Avoid SSR/client Date.now() mismatch on first paint (hydration warning hell)
  const sessionDemoMs =
    tick == null || !sessionStartedAt
      ? 0
      : (tick - sessionStartedAt) * demoSpeed;
  const highDemoMs =
    tick != null && behaviourHighSince != null
      ? (tick - behaviourHighSince) * demoSpeed
      : null;
  const resetRemainingMs =
    highDemoMs != null
      ? Math.max(0, WELLNESS_TRIGGER_MS - highDemoMs)
      : null;
  const wallSecsForReset = Math.round(WELLNESS_TRIGGER_MS / demoSpeed / 1000);
  const isHigh = level === WORKLOAD_LEVELS.HIGH;

  const selectClass =
    "h-7 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 text-[11px] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center gap-1 py-1"
        title={
          isHigh && resetRemainingMs != null
            ? `Focus Reset in ${formatDuration(resetRemainingMs)} · ×${demoSpeed}`
            : `Session ${formatDuration(sessionDemoMs)} · ×${demoSpeed}`
        }
      >
        <span className="font-mono text-[10px] tabular-nums text-[var(--text-secondary)]">
          {isHigh && resetRemainingMs != null
            ? formatDuration(resetRemainingMs)
            : formatDuration(sessionDemoMs)}
        </span>
        <span className="text-[9px] text-[var(--text-muted)]">
          {isHigh ? "reset" : `×${demoSpeed}`}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 p-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Demo
        </span>
        <span
          className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]"
          title="Total session time (not the Focus Reset timer)"
        >
          {formatDuration(sessionDemoMs)}
          <span className="ml-1 text-[10px] font-normal text-[var(--text-muted)]">
            ×{demoSpeed}
          </span>
        </span>
      </div>

      <div className="rounded-md bg-[var(--surface)]/80 px-1.5 py-1">
        {focusResetMuted ? (
          <p className="text-[10px] leading-snug text-amber-800">
            Focus Reset muted today.{" "}
            <button
              type="button"
              className="font-medium underline underline-offset-2"
              onClick={clearWellnessMute}
            >
              Clear mute
            </button>
          </p>
        ) : wellnessVisible ? (
          <p className="text-[10px] font-medium text-emerald-800">
            Focus Reset is open
          </p>
        ) : isHigh && resetRemainingMs != null ? (
          <p className="text-[10px] font-medium text-amber-800">
            High for {formatDuration(highDemoMs)} · Reset in{" "}
            {formatDuration(resetRemainingMs)}
            <span className="mt-0.5 block font-normal text-[var(--text-muted)]">
              ~{wallSecsForReset}s wall at ×{demoSpeed}
            </span>
          </p>
        ) : (
          <p className="text-[10px] leading-snug text-[var(--text-muted)]">
            Focus Reset needs <span className="font-medium">High</span> for 10
            demo-min (not session time). Set override to High, then wait ~
            {wallSecsForReset}s.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <select
          aria-label="Demo clock speed"
          className={selectClass}
          value={demoSpeed}
          onChange={(e) => setDemoSpeed(Number(e.target.value))}
        >
          {DEMO_SPEED_OPTIONS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}×
            </option>
          ))}
        </select>
        <select
          aria-label="Demo override for estimated workload"
          className={selectClass}
          value={forcedLevel || ""}
          onChange={(e) => setForcedLevel(e.target.value || null)}
        >
          <option value="">Live ({WORKLOAD_LABELS[liveLevel]})</option>
          <option value={WORKLOAD_LEVELS.CALM}>{WORKLOAD_LABELS.calm}</option>
          <option value={WORKLOAD_LEVELS.NEUTRAL}>
            {WORKLOAD_LABELS.neutral}
          </option>
          <option value={WORKLOAD_LEVELS.HIGH}>{WORKLOAD_LABELS.high}</option>
        </select>
      </div>

      <div>
        <p className="mb-1 text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
          Simulate · sample data
        </p>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            className={simBtn}
            onClick={injectUrgentEmail}
            title="Add an urgent unread sample email"
          >
            +Urgent
          </button>
          <button
            type="button"
            className={simBtn}
            onClick={injectHighPriorityTask}
            title="Add a high-priority sample task"
          >
            +Task
          </button>
          <button
            type="button"
            className={simBtn}
            onClick={() => injectNotifications(5)}
            title="Add five sample notifications"
          >
            +5 Notifs
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={previewWellness}
        className="w-full rounded-md px-1 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        Preview Focus Reset
      </button>
    </div>
  );
}
