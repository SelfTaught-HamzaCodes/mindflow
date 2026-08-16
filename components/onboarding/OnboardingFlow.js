"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { usePrefs } from "@/context/PrefsContext";
import LogoMark from "@/components/layout/LogoMark";
import Button from "@/components/ui/Button";
import { logoFont } from "@/lib/logoFont";
import {
  BREAKS,
  DENSITY,
  INTERRUPTIONS,
  ONBOARDING_DEFAULTS,
  PRIMARY_FOCUS,
} from "@/lib/userPrefs";
import TypingCalibrateStep from "@/components/onboarding/TypingCalibrateStep";

const STEPS = ["welcome", "name", "typing", "density", "focus", "pace"];

const DENSITY_OPTIONS = [
  {
    id: DENSITY.QUIET,
    title: "Quiet",
    detail: "Priorities only. Calendar and extras stay out of the way.",
  },
  {
    id: DENSITY.BALANCED,
    title: "Balanced",
    detail: "Priorities plus a little context. Activity feed stays hidden.",
  },
  {
    id: DENSITY.FULL,
    title: "Full",
    detail: "The complete workspace: insights, calendar, and activity.",
  },
];

const FOCUS_OPTIONS = [
  {
    id: PRIMARY_FOCUS.PRIORITIES,
    title: "Priorities",
    detail: "Today’s important mail and tasks first.",
  },
  {
    id: PRIMARY_FOCUS.INBOX,
    title: "Inbox",
    detail: "Keep email front of mind.",
  },
  {
    id: PRIMARY_FOCUS.TASKS,
    title: "Tasks",
    detail: "Lead with what still needs doing.",
  },
  {
    id: PRIMARY_FOCUS.CALENDAR,
    title: "Calendar",
    detail: "Keep today’s schedule visible, even in a quiet layout.",
  },
];

const INTERRUPTION_OPTIONS = [
  {
    id: INTERRUPTIONS.QUIET,
    title: "Priority only",
    detail: "Hold the rest until things calm down.",
  },
  {
    id: INTERRUPTIONS.BALANCED,
    title: "Balanced",
    detail: "Priority and normal. Skip the low-noise items.",
  },
  {
    id: INTERRUPTIONS.INFORMED,
    title: "Keep me informed",
    detail: "Show the full notification mix when the workspace is calm.",
  },
];

const BREAK_OPTIONS = [
  {
    id: BREAKS.WHEN_NEEDED,
    title: "When needed",
    detail: "A reset after a longer stretch of high demand.",
  },
  {
    id: BREAKS.RARELY,
    title: "Rarely",
    detail: "Wait longer, and learn if you usually dismiss them.",
  },
  {
    id: BREAKS.OFTEN,
    title: "A bit more often",
    detail: "Shorter wait if you’d rather be prompted sooner.",
  },
];

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
};

/**
 * Short first-visit setup. Answers seed density / interruptions / breaks;
 * later use can nudge those without coming back here.
 */
export default function OnboardingFlow({ mode = "first-visit" }) {
  const { prefs, complete, closeEditor } = usePrefs();
  const isEditor = mode === "editor";

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    displayName: prefs.displayName || "",
    density: prefs.onboarded ? prefs.density : ONBOARDING_DEFAULTS.density,
    primaryFocus: prefs.onboarded
      ? prefs.primaryFocus
      : ONBOARDING_DEFAULTS.primaryFocus,
    interruptions: prefs.onboarded
      ? prefs.interruptions
      : ONBOARDING_DEFAULTS.interruptions,
    breaks: prefs.onboarded ? prefs.breaks : ONBOARDING_DEFAULTS.breaks,
    typingBaseline: prefs.typingBaseline || null,
  });

  const last = STEPS.length - 1;
  const questionIndex = Math.max(0, step);
  const totalQuestions = STEPS.length;

  function patch(partial) {
    setAnswers((prev) => ({ ...prev, ...partial }));
  }

  function finish(nextAnswers = answers) {
    complete({
      ...nextAnswers,
      typingBaseline:
        nextAnswers.typingBaseline ?? prefs.typingBaseline ?? null,
    });
  }

  function skip() {
    finish({
      ...ONBOARDING_DEFAULTS,
      displayName: answers.displayName,
      typingBaseline: null,
    });
  }

  return (
    <div
      className={
        isEditor
          ? "fixed inset-0 z-[90] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          : "flex min-h-svh items-center justify-center bg-[var(--background)] px-4 py-10"
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-lg)] sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogoMark />
            <p
              className={`${logoFont.className} text-sm font-semibold tracking-tight text-[var(--text-primary)]`}
            >
              Mindflow
            </p>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            {questionIndex + 1} / {totalQuestions}
          </p>
        </div>

        <div className="mb-5 flex gap-1" aria-hidden="true">
          {STEPS.map((id, i) => (
            <span
              key={id}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-[var(--accent)]" : "bg-[var(--surface-muted)]"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={STEPS[step]} {...fade}>
            {step === 0 ? (
              <WelcomeStep isEditor={isEditor} />
            ) : null}
            {step === 1 ? (
              <NameStep
                value={answers.displayName}
                onChange={(displayName) => patch({ displayName })}
              />
            ) : null}
            {step === 2 ? (
              <TypingCalibrateStep
                baseline={answers.typingBaseline}
                onBaseline={(typingBaseline) => patch({ typingBaseline })}
              />
            ) : null}
            {step === 3 ? (
              <ChoiceStep
                title="How busy should the workspace feel?"
                subtitle="You can change this later. The interface also learns from how you work."
                options={DENSITY_OPTIONS}
                value={answers.density}
                onChange={(density) => patch({ density })}
              />
            ) : null}
            {step === 4 ? (
              <ChoiceStep
                title="What should stay front and centre?"
                subtitle="We’ll keep this surface easier to reach."
                options={FOCUS_OPTIONS}
                value={answers.primaryFocus}
                onChange={(primaryFocus) => patch({ primaryFocus })}
              />
            ) : null}
            {step === 5 ? (
              <div className="space-y-6">
                <ChoiceStep
                  title="How should interruptions arrive?"
                  options={INTERRUPTION_OPTIONS}
                  value={answers.interruptions}
                  onChange={(interruptions) => patch({ interruptions })}
                />
                <ChoiceStep
                  title="Reset suggestions"
                  subtitle="A short Focus Reset after sustained high demand. Never medical advice."
                  options={BREAK_OPTIONS}
                  value={answers.breaks}
                  onChange={(breaks) => patch({ breaks })}
                />
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back
              </Button>
            ) : isEditor ? (
              <Button variant="ghost" size="sm" onClick={closeEditor}>
                Cancel
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={skip}>
                Skip for now
              </Button>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (step === last) finish();
              else setStep((s) => s + 1);
            }}
          >
            {step === last ? (
              <>
                {isEditor ? "Save preferences" : "Start workspace"}
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({ isEditor }) {
  return (
    <div>
      <h1
        id="onboarding-title"
        className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]"
      >
        {isEditor ? "Workspace preferences" : "A quieter start"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        {isEditor
          ? "A few answers reshape density, interruptions, and reset timing. Mindflow keeps learning from what you do next."
          : "A few questions plus a short sentence to type, so usual typos are not treated as high load. Nothing here is medical, and you can skip."}
      </p>
    </div>
  );
}

function NameStep({ value, onChange }) {
  return (
    <div>
      <h2
        id="onboarding-title"
        className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
      >
        What should we call you?
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Optional. Used in greetings only, not stored on a server.
      </p>
      <label className="mt-4 block">
        <span className="sr-only">Preferred name</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Sam"
          autoComplete="nickname"
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        />
      </label>
    </div>
  );
}

function ChoiceStep({ title, subtitle, options, value, onChange }) {
  return (
    <div>
      <h2
        id="onboarding-title"
        className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
      ) : null}
      <div className="mt-4 grid gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={`rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                selected
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-white hover:bg-[var(--surface-muted)]"
              }`}
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {option.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                {option.detail}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
