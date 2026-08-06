/**
 * Pure typing-behaviour metric helpers.
 * Pulled out of the hook so unit tests (and Chapter 4) can hit the maths
 * without mounting React. Sliding window feeds calculateBehaviourState.
 */

export const TYPING_WINDOW_MS = 45000;
export const WORD_CHARS = 5; // classic WPM: 5 chars ≈ 1 word

/**
 * Population stddev — used for consistency, never shown raw to users.
 */
export function stdDev(values) {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Inter-key variability → 0–1 consistency.
 * Magic 250ms divisor is rough; just needed something that felt sane in pilots.
 */
export function intervalsToConsistency(intervals) {
  if (intervals.length < 3) return 0.5;
  const sd = stdDev(intervals);
  // typical keystroke SD sits ~50–200ms; map into 0–1
  return Math.max(0, Math.min(1, 1 - sd / 250));
}

/**
 * Turn raw key events into estimator inputs.
 * Floors span at 1s so a single keypress doesnt explode WPM into the thousands.
 */
export function computeTypingMetrics(
  events,
  now = Date.now(),
  windowMs = TYPING_WINDOW_MS,
) {
  const windowed = (events || []).filter((e) => now - e.t <= windowMs);

  if (!windowed.length) {
    return {
      wpm: 0,
      avgPauseMs: 0,
      backspaceRate: 0,
      consistency: 0.5,
      eventCount: 0,
    };
  }

  const backspaces = windowed.filter((e) => e.type === "backspace").length;
  const chars = windowed.filter((e) => e.type === "char").length;
  const pauses = windowed.map((e) => e.pauseMs).filter((p) => p != null);
  const avgPauseMs = pauses.length
    ? pauses.reduce((a, b) => a + b, 0) / pauses.length
    : 0;

  const spanMs = Math.max(
    1000,
    windowed[windowed.length - 1].t - windowed[0].t,
  );
  const minutes = spanMs / 60000;
  const wpm = minutes > 0 ? chars / WORD_CHARS / minutes : 0;
  const backspaceRate = windowed.length ? backspaces / windowed.length : 0;
  const consistency = intervalsToConsistency(pauses);

  return {
    wpm: Math.round(wpm * 10) / 10,
    avgPauseMs: Math.round(avgPauseMs),
    backspaceRate: Math.round(backspaceRate * 1000) / 1000,
    consistency: Math.round(consistency * 100) / 100,
    eventCount: windowed.length,
  };
}
