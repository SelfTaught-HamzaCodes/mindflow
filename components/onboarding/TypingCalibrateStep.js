"use client";

import { useRef, useState } from "react";
import { computeTypingMetrics } from "@/lib/typingMetrics";
import {
  MIN_CALIBRATION_EVENTS,
  buildTypingBaseline,
  describeTypingBaseline,
} from "@/lib/typingBaseline";

export const CALIBRATION_SENTENCE =
  "The morning notes are on my desk. I will send them after the meeting.";

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Fixed sentence so people are not stuck inventing something to type.
 * We only keep rhythm / corrections. The words are not stored.
 */
export default function TypingCalibrateStep({ baseline, onBaseline }) {
  const eventsRef = useRef([]);
  const lastKeyRef = useRef(null);
  const [text, setText] = useState("");
  const [eventCount, setEventCount] = useState(baseline?.eventCount || 0);

  function handleKeyDown(event) {
    if (
      event.key === "Shift" ||
      event.key === "Control" ||
      event.key === "Alt" ||
      event.key === "Meta" ||
      event.key === "CapsLock" ||
      event.key === "Tab"
    ) {
      return;
    }

    const now = Date.now();
    const pauseMs =
      lastKeyRef.current != null ? now - lastKeyRef.current : null;
    lastKeyRef.current = now;

    const isBackspace = event.key === "Backspace" || event.key === "Delete";
    const isChar =
      !isBackspace &&
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey;

    if (!isBackspace && !isChar) return;

    eventsRef.current.push({
      t: now,
      type: isBackspace ? "backspace" : "char",
      pauseMs,
    });

    const metrics = computeTypingMetrics(
      eventsRef.current,
      now,
      10 * 60 * 1000,
    );
    setEventCount(metrics.eventCount);
    onBaseline(buildTypingBaseline(metrics));
  }

  const typed = normalize(text);
  const target = normalize(CALIBRATION_SENTENCE);
  const finished = typed === target;
  const ready =
    finished ||
    (eventCount >= MIN_CALIBRATION_EVENTS &&
      typed.length >= target.length - 6);
  const note = describeTypingBaseline(baseline);

  return (
    <div>
      <h2
        id="onboarding-title"
        className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
      >
        Type this sentence
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
        Copy it as you normally would. Mistakes are fine. This is only to learn
        your rhythm, not to mark spelling. The words are not saved.
      </p>
      <blockquote className="mt-3 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm font-medium leading-relaxed text-[var(--text-primary)]">
        {CALIBRATION_SENTENCE}
      </blockquote>
      <label className="mt-3 block">
        <span className="sr-only">Type the sentence shown above</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          placeholder="Type the sentence here"
          autoComplete="off"
          spellCheck={false}
          className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        />
      </label>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        {ready
          ? "Sample captured. Continue when you are ready."
          : "Keep going until the sentence is done."}
      </p>
      {ready && note ? (
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          {note}
        </p>
      ) : null}
    </div>
  );
}
