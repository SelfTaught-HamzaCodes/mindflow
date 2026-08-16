"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePrefs } from "@/context/PrefsContext";
import { summarizeTypingRules } from "@/lib/typingBaseline";
import {
  BREAKS,
  DENSITY,
  INTERRUPTIONS,
  PRIMARY_FOCUS,
} from "@/lib/userPrefs";

const selectClass =
  "mt-1 h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

/**
 * Avatar dropdown: change workspace prefs without replaying onboarding,
 * and show the estimator rules taken from the typing sample.
 */
export default function PreferencesMenu() {
  const { displayUser, prefs, update } = usePrefs();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef(null);
  const typing = summarizeTypingRules(prefs.typingBaseline);

  useEffect(() => {
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-label={`Workspace preferences for ${displayUser.name}`}
        aria-expanded={open}
        aria-controls={panelId}
        title="Workspace preferences"
      >
        {displayUser.avatarInitials}
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 z-40 mt-2 w-[20.5rem] max-h-[min(80vh,32rem)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-lg)]"
          role="dialog"
          aria-label="Workspace preferences"
        >
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Preferences
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            Changes apply straight away. No need to repeat setup.
          </p>

          <label className="mt-3 block">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              Workspace density
            </span>
            <select
              className={selectClass}
              value={prefs.density}
              onChange={(e) => update({ density: e.target.value })}
            >
              <option value={DENSITY.QUIET}>Quiet</option>
              <option value={DENSITY.BALANCED}>Balanced</option>
              <option value={DENSITY.FULL}>Full</option>
            </select>
          </label>

          <label className="mt-2.5 block">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              Front and centre
            </span>
            <select
              className={selectClass}
              value={prefs.primaryFocus}
              onChange={(e) => update({ primaryFocus: e.target.value })}
            >
              <option value={PRIMARY_FOCUS.PRIORITIES}>Priorities</option>
              <option value={PRIMARY_FOCUS.INBOX}>Inbox</option>
              <option value={PRIMARY_FOCUS.TASKS}>Tasks</option>
              <option value={PRIMARY_FOCUS.CALENDAR}>Calendar</option>
            </select>
          </label>

          <label className="mt-2.5 block">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              Interruptions
            </span>
            <select
              className={selectClass}
              value={prefs.interruptions}
              onChange={(e) => update({ interruptions: e.target.value })}
            >
              <option value={INTERRUPTIONS.QUIET}>Priority only</option>
              <option value={INTERRUPTIONS.BALANCED}>Balanced</option>
              <option value={INTERRUPTIONS.INFORMED}>Keep me informed</option>
            </select>
          </label>

          <label className="mt-2.5 block">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              Reset suggestions
            </span>
            <select
              className={selectClass}
              value={prefs.breaks}
              onChange={(e) => update({ breaks: e.target.value })}
            >
              <option value={BREAKS.WHEN_NEEDED}>When needed</option>
              <option value={BREAKS.RARELY}>Rarely</option>
              <option value={BREAKS.OFTEN}>A bit more often</option>
            </select>
          </label>

          <div className="mt-3 rounded-xl bg-[var(--surface-muted)] px-3 py-2.5">
            <p className="text-[11px] font-medium text-[var(--text-primary)]">
              From your typing sample
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
              {typing.summary}
            </p>
            <ul className="mt-2 space-y-1">
              {typing.rules.map((rule) => (
                <li
                  key={rule}
                  className="text-[11px] leading-relaxed text-[var(--text-secondary)]"
                >
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
