"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wind } from "lucide-react";

/**
 * Box-breathing visual guide with timed phases.
 * Hold phases keep the same scale as the previous inhale/exhale.
 */
const STEPS = [
  { id: "inhale", label: "Inhale", seconds: 4, scale: 1.18, animate: true },
  { id: "hold-in", label: "Hold", seconds: 2, scale: 1.18, animate: false },
  { id: "exhale", label: "Exhale", seconds: 4, scale: 0.88, animate: true },
  { id: "hold-out", label: "Repeat", seconds: 2, scale: 0.88, animate: false },
];

export default function BreathingCircle({
  size = "md",
  active = true,
  showTiming = false,
  className = "",
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return undefined;
    }

    const ms = (STEPS[stepIndex]?.seconds || 2) * 1000;
    const id = setTimeout(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, ms);
    return () => clearTimeout(id);
  }, [active, stepIndex]);

  const outer =
    size === "lg"
      ? "h-32 w-32"
      : size === "sm"
        ? "h-20 w-20"
        : "h-24 w-24";
  const inner =
    size === "lg"
      ? "h-20 w-20"
      : size === "sm"
        ? "h-12 w-12"
        : "h-14 w-14";
  const icon = size === "lg" ? "h-8 w-8" : "h-7 w-7";

  if (!active) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div
          className={`flex ${outer} items-center justify-center rounded-full bg-white text-sky-700 shadow-[var(--shadow-sm)]`}
          aria-hidden="true"
        >
          <Wind className={icon} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        className={`flex ${outer} items-center justify-center rounded-full bg-white text-[var(--accent)] shadow-[var(--shadow-sm)]`}
        animate={{ scale: step.scale }}
        transition={
          step.animate
            ? { duration: Math.max(0.4, step.seconds - 0.15), ease: "easeInOut" }
            : { duration: 0 }
        }
        aria-hidden="true"
      >
        <div
          className={`flex ${inner} items-center justify-center rounded-full bg-[var(--accent-soft)]`}
        >
          <Wind className={icon} />
        </div>
      </motion.div>
      <p
        className="mt-3 text-sm font-medium text-[var(--text-primary)]"
        aria-live="polite"
      >
        {step.label}
      </p>
      {showTiming ? (
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          {step.seconds} seconds
        </p>
      ) : null}
      {showTiming ? (
        <ol className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span
                className={
                  i === stepIndex
                    ? "font-medium text-[var(--text-primary)]"
                    : undefined
                }
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 ? <span aria-hidden="true">↓</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
