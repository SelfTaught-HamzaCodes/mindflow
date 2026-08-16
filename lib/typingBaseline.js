/**
 * Personal typing baseline from a short onboarding sample.
 *
 * Some people naturally correct a lot (or type slowly). That is style, not
 * Elevated / High load. We raise their correction thresholds and drop the
 * backspace weight so the estimator compares them to themselves.
 */

import {
  DEFAULT_SIGNAL_WEIGHTS,
  ESTIMATOR_THRESHOLDS,
} from "./workloadEstimator";

export { DEFAULT_SIGNAL_WEIGHTS };

/** A short sentence is enough — don't make onboarding feel like a test. */
export const MIN_CALIBRATION_EVENTS = 16;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function clamp01(n) {
  return clamp(n, 0, 1);
}

/**
 * Turn a sample's metrics into stored weights + personal thresholds.
 * Returns null if they didn't type enough (fall back to research defaults).
 */
export function buildTypingBaseline(metrics) {
  const eventCount = metrics?.eventCount ?? 0;
  if (eventCount < MIN_CALIBRATION_EVENTS) return null;

  const backspaceRate = clamp01(metrics.backspaceRate ?? 0);
  const wpm = Math.max(0, metrics.wpm ?? 0);
  const avgPauseMs = Math.max(0, metrics.avgPauseMs ?? 0);
  const consistency = clamp01(metrics.consistency ?? 0.5);

  const defaultCalmBs = ESTIMATOR_THRESHOLDS.calmBackspaceMax;
  const excessCorrections = Math.max(0, backspaceRate - defaultCalmBs);

  // Natural messy typists: backspace should matter less than pauses / speed.
  const backspaceWeight = clamp(
    DEFAULT_SIGNAL_WEIGHTS.backspace - excessCorrections,
    0.08,
    DEFAULT_SIGNAL_WEIGHTS.backspace,
  );
  const leftover = DEFAULT_SIGNAL_WEIGHTS.backspace - backspaceWeight;
  const weights = {
    wpm: DEFAULT_SIGNAL_WEIGHTS.wpm + leftover * 0.4,
    pause: DEFAULT_SIGNAL_WEIGHTS.pause + leftover * 0.4,
    backspace: backspaceWeight,
    consistency: DEFAULT_SIGNAL_WEIGHTS.consistency + leftover * 0.2,
  };

  const calmBackspaceMax = Math.max(
    defaultCalmBs,
    Math.min(0.45, backspaceRate + 0.03),
  );
  const highBackspaceMin = Math.max(
    ESTIMATOR_THRESHOLDS.highBackspaceMin,
    Math.min(0.6, calmBackspaceMax + 0.1),
  );

  let calmWpmMin = ESTIMATOR_THRESHOLDS.calmWpmMin;
  let highWpmMax = ESTIMATOR_THRESHOLDS.highWpmMax;
  if (wpm > 5 && wpm < ESTIMATOR_THRESHOLDS.calmWpmMin) {
    highWpmMax = Math.min(
      ESTIMATOR_THRESHOLDS.highWpmMax,
      Math.max(8, Math.round(wpm * 0.6)),
    );
    calmWpmMin = Math.max(wpm + 6, highWpmMax + 8);
  }

  return {
    capturedAt: new Date().toISOString(),
    eventCount,
    wpm,
    avgPauseMs,
    backspaceRate,
    consistency,
    weights,
    thresholds: {
      calmBackspaceMax,
      highBackspaceMin,
      calmWpmMin,
      highWpmMax,
    },
  };
}

export function resolveEstimatorConfig(baseline) {
  return {
    weights: baseline?.weights || DEFAULT_SIGNAL_WEIGHTS,
    thresholds: {
      ...ESTIMATOR_THRESHOLDS,
      ...(baseline?.thresholds || {}),
    },
  };
}

export function describeTypingBaseline(baseline) {
  if (!baseline) return "";
  if (baseline.backspaceRate >= 0.12) {
    return "You correct as you go. We'll treat that as normal, not as Elevated.";
  }
  return "Later typing is compared to this sample, not to a generic average.";
}

/**
 * Plain-language rules from the onboarding typing sample.
 */
export function summarizeTypingRules(baseline) {
  if (!baseline) {
    return {
      hasSample: false,
      summary: "No typing sample yet. Default research rules are in use.",
      rules: [
        "Correction weight stays at the default 25%",
        "High correction rate starts at 18%",
      ],
    };
  }

  const bsPct = Math.round((baseline.backspaceRate || 0) * 100);
  const weightPct = Math.round(
    (baseline.weights?.backspace ?? DEFAULT_SIGNAL_WEIGHTS.backspace) * 100,
  );
  const calmPct = Math.round(
    (baseline.thresholds?.calmBackspaceMax ??
      ESTIMATOR_THRESHOLDS.calmBackspaceMax) * 100,
  );
  const highPct = Math.round(
    (baseline.thresholds?.highBackspaceMin ??
      ESTIMATOR_THRESHOLDS.highBackspaceMin) * 100,
  );

  const rules = [
    `Your sample correction rate was about ${bsPct}%`,
    weightPct < Math.round(DEFAULT_SIGNAL_WEIGHTS.backspace * 100)
      ? `Correction weight reduced to ${weightPct}% (default 25%)`
      : `Correction weight stays at the default ${weightPct}%`,
    `Corrections count as calm up to ${calmPct}%`,
    `High only if corrections go above ${highPct}%`,
  ];

  if (baseline.wpm > 0) {
    rules.push(`Usual typing speed around ${Math.round(baseline.wpm)} WPM`);
    if (
      baseline.thresholds?.highWpmMax != null &&
      baseline.thresholds.highWpmMax < ESTIMATOR_THRESHOLDS.highWpmMax
    ) {
      rules.push(
        `Slow-speed High threshold adjusted to ${baseline.thresholds.highWpmMax} WPM`,
      );
    }
  }

  return {
    hasSample: true,
    summary: describeTypingBaseline(baseline),
    rules,
  };
}
