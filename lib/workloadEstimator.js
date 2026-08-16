/**
 * Behavioural workload estimator (research heuristic).
 *
 * IMPORTANT: this estimates behavioural / cognitive workload from typing
 * patterns. It does NOT diagnose medical stress — wording matters for ethics.
 *
 * Inputs (sliding window):
 * - wpm, avgPauseMs, backspaceRate, consistency
 *
 * Output: "calm" | "neutral" | "high"
 *
 * Why rule-based instead of ML? Transparency for the dissertation + viva —
 * examiners can audit every threshold. Also we dont have enough labelled data
 * for a model that would be honest about confidence.
 */

import { WORKLOAD_LEVELS, WORKLOAD_LABELS } from "./constants";

/** Default mix — onboarding can lower backspace if someone naturally corrects a lot. */
export const DEFAULT_SIGNAL_WEIGHTS = {
  wpm: 0.25,
  pause: 0.3,
  backspace: 0.25,
  consistency: 0.2,
};

/** Thresholds kept explicit so Chapter 4 can cite them without reading code. */
export const ESTIMATOR_THRESHOLDS = {
  calmWpmMin: 45,
  highWpmMax: 28,
  calmPauseMaxMs: 350,
  highPauseMinMs: 700,
  calmBackspaceMax: 0.08,
  highBackspaceMin: 0.18,
  calmConsistencyMin: 0.55,
  highConsistencyMax: 0.35,
  /** Need a few keystrokes before we pretend the estimate means anything */
  minEvents: 12,
  /** Hysteresis — stops the badge flickering between Elevated/High mid-sentence */
  hysteresisMargin: 0.15,
};

/**
 * Score each signal toward high load (0 = calm-ish, 1 = high-load-ish).
 * Direction of each signal comes from HCI literature, not vibes.
 */
function signalScores(metrics, baseline = null) {
  const {
    wpm = 0,
    avgPauseMs = 0,
    backspaceRate = 0,
    consistency = 0.5,
  } = metrics;
  const t = { ...ESTIMATOR_THRESHOLDS, ...(baseline?.thresholds || {}) };

  const clamp01 = (n) => Math.min(1, Math.max(0, n));

  // Faster typing usually = smoother flow → lower high-load score
  const wpmScore = clamp01(
    (t.calmWpmMin - wpm) / (t.calmWpmMin - t.highWpmMax),
  );

  // Long pauses often mean hesistation / overload
  const pauseScore = clamp01(
    (avgPauseMs - t.calmPauseMaxMs) / (t.highPauseMinMs - t.calmPauseMaxMs),
  );

  // Lots of backspaces → more corrections under pressure
  const backspaceScore = clamp01(
    (backspaceRate - t.calmBackspaceMax) /
      (t.highBackspaceMin - t.calmBackspaceMax),
  );

  // Irregular rhythm → higher load estimate
  const consistencyScore = clamp01(
    (t.calmConsistencyMin - consistency) /
      (t.calmConsistencyMin - t.highConsistencyMax),
  );

  return { wpmScore, pauseScore, backspaceScore, consistencyScore };
}

/**
 * Weighted composite in [0, 1]. Higher = higher cognitive load estimate.
 * Pause + backspace get a bit more weight — stronger proxies in the papers I read.
 */
export function computeLoadScore(metrics, baseline = null) {
  const { wpmScore, pauseScore, backspaceScore, consistencyScore } =
    signalScores(metrics, baseline);
  const w = baseline?.weights || DEFAULT_SIGNAL_WEIGHTS;

  const score =
    wpmScore * w.wpm +
    pauseScore * w.pause +
    backspaceScore * w.backspace +
    consistencyScore * w.consistency;

  return Math.min(1, Math.max(0, score));
}

/**
 * Bucket score into Calm / Elevated / High.
 * Bands are a bit arbitrary — tuned during pilot so demos feel responsive.
 */
export function scoreToLevel(score) {
  if (score < 0.35) return WORKLOAD_LEVELS.CALM;
  if (score < 0.65) return WORKLOAD_LEVELS.NEUTRAL;
  return WORKLOAD_LEVELS.HIGH;
}

/**
 * Hysteresis so levels dont flicker when you're sitting on a band edge.
 * Without this the UI was flashing Focus Mode on/off during normal typing.
 */
export function applyHysteresis(nextLevel, previousLevel, score) {
  if (!previousLevel || previousLevel === nextLevel) return nextLevel;

  const margin = ESTIMATOR_THRESHOLDS.hysteresisMargin;
  const bands = {
    [WORKLOAD_LEVELS.CALM]: [0, 0.35],
    [WORKLOAD_LEVELS.NEUTRAL]: [0.35, 0.65],
    [WORKLOAD_LEVELS.HIGH]: [0.65, 1],
  };

  const [low, high] = bands[nextLevel];
  // Prefer sticking with previous unless we're clearly inside the new band
  if (score < low + margin * 0.5 || score > high - margin * 0.5) {
    const [pLow, pHigh] = bands[previousLevel];
    if (score >= pLow - margin && score <= pHigh + margin) {
      return previousLevel;
    }
  }

  return nextLevel;
}

/**
 * Main entry — rule-based, no AI/ML.
 * Maps typing metrics → Calm | Elevated | High (Workspace Status).
 *
 * Returns insufficientData=true when we havent seen enough keystrokes yet;
 * better to stay Neutral than invent a High from 3 keys.
 */
export function calculateBehaviourState(
  metrics = {},
  previousLevel = null,
  baseline = null,
) {
  const eventCount = metrics.eventCount ?? 0;
  const confidence = Math.min(
    1,
    eventCount / ESTIMATOR_THRESHOLDS.minEvents,
  );

  if (eventCount < ESTIMATOR_THRESHOLDS.minEvents) {
    const level = previousLevel || WORKLOAD_LEVELS.NEUTRAL;
    return {
      state: level,
      level,
      label: WORKLOAD_LABELS[level],
      score: 0.5,
      confidence,
      signals: signalScores(metrics, baseline),
      insufficientData: true,
      metrics: {
        wpm: metrics.wpm ?? 0,
        avgPauseMs: metrics.avgPauseMs ?? 0,
        backspaceRate: metrics.backspaceRate ?? 0,
        consistency: metrics.consistency ?? 0.5,
        eventCount,
      },
    };
  }

  const score = computeLoadScore(metrics, baseline);
  const rawLevel = scoreToLevel(score);
  const level = applyHysteresis(rawLevel, previousLevel, score);

  return {
    state: level,
    level,
    label: WORKLOAD_LABELS[level],
    score,
    confidence,
    signals: signalScores(metrics, baseline),
    insufficientData: false,
    metrics: {
      wpm: metrics.wpm ?? 0,
      avgPauseMs: metrics.avgPauseMs ?? 0,
      backspaceRate: metrics.backspaceRate ?? 0,
      consistency: metrics.consistency ?? 0.5,
      eventCount,
    },
  };
}

/** @deprecated Prefer calculateBehaviourState — left so older call sites dont break */
export function estimateWorkload(metrics, previousLevel = null, baseline = null) {
  return calculateBehaviourState(metrics, previousLevel, baseline);
}
