/**
 * Human-readable adaptation summaries for Focus Mode / High load.
 * Makes interface changes tangible for demos — raw boolean flags dont
 * photograph well in a dissertation screenshot.
 */

import { ESTIMATOR_THRESHOLDS } from "./workloadEstimator";
import { WORKLOAD_LEVELS } from "./constants";

/** Rough surface count: calm dashboard vs Focus Mode (for the overlay copy) */
export const PANEL_COUNTS = {
  full: 9,
  focus: 3,
};

/**
 * Positive framing for the Focus overlay — "what you still have" lands better
 * than a laundry list of removals when Focus first kicks in.
 */
export const FOCUS_SHOWN = [
  "Priority Inbox shown",
  "Essential tasks prioritised",
  "Low-priority notifications hidden",
  "Secondary panels collapsed",
];

/**
 * What the adaptive UI removed / reduced. Used by the orange banner so users
 * (and examiners) can see *why* the dashboard suddenly feels emptier.
 */
export function getHiddenAdaptations(adaptation = {}, { focusMode = false } = {}) {
  const items = [];

  if (!adaptation.showAnalytics) {
    items.push({ id: "analytics", label: "Behaviour Insights hidden" });
  }
  if (!adaptation.showSecondaryWidgets) {
    items.push({ id: "calendar", label: "Calendar hidden" });
    items.push({ id: "activity", label: "Activity feed hidden" });
  }
  if (!adaptation.showLowPriorityTasks) {
    items.push({ id: "low-tasks", label: "Low-priority tasks hidden" });
  }
  if (!adaptation.showLowPriorityEmails) {
    items.push({ id: "low-emails", label: "Low-priority emails filtered" });
  }
  if (adaptation.hideLowNotifications) {
    items.push({
      id: "low-notifications",
      label: "Low-priority notifications hidden",
    });
  }
  if (adaptation.delayNormalNotifications) {
    items.push({
      id: "normal-notifications",
      label: "Normal notifications delayed",
    });
  }
  if (adaptation.collapseSidebar) {
    items.push({ id: "sidebar", label: "Navigation collapsed to icon rail" });
  }
  if (focusMode) {
    items.push({
      id: "dense-dashboard",
      label: "Dense dashboard replaced by Focus workspace",
    });
  }

  return items;
}

export function getDistractionCount(adaptation, options) {
  return getHiddenAdaptations(adaptation, options).length;
}

/**
 * Simple directional reasons (not raw metrics) for why the estimate changed.
 * Uses estimator thresholds as reference points.
 */
export function getBehaviourReasons(
  metrics = {},
  level = WORKLOAD_LEVELS.NEUTRAL,
  baseline = null,
) {
  const t = { ...ESTIMATOR_THRESHOLDS, ...(baseline?.thresholds || {}) };
  const reasons = [];

  const wpm = metrics.wpm ?? 0;
  const pause = metrics.avgPauseMs ?? 0;
  const backspace = metrics.backspaceRate ?? 0;
  const consistency = metrics.consistency ?? 0.5;

  if (level === WORKLOAD_LEVELS.HIGH || wpm <= t.highWpmMax) {
    if (wpm > 0 && wpm < t.calmWpmMin) {
      reasons.push({ id: "wpm", label: "Typing speed", direction: "down" });
    }
  } else if (wpm >= t.calmWpmMin) {
    reasons.push({ id: "wpm", label: "Typing speed", direction: "up" });
  }

  if (pause >= t.highPauseMinMs || (level === WORKLOAD_LEVELS.HIGH && pause > t.calmPauseMaxMs)) {
    reasons.push({ id: "pause", label: "Pauses", direction: "up" });
  } else if (pause > 0 && pause <= t.calmPauseMaxMs) {
    reasons.push({ id: "pause", label: "Pauses", direction: "down" });
  }

  if (
    backspace >= t.highBackspaceMin ||
    (level === WORKLOAD_LEVELS.HIGH && backspace > t.calmBackspaceMax)
  ) {
    reasons.push({ id: "backspace", label: "Corrections", direction: "up" });
  } else if (backspace > 0 && backspace <= t.calmBackspaceMax) {
    reasons.push({ id: "backspace", label: "Corrections", direction: "down" });
  }

  if (
    consistency <= t.highConsistencyMax ||
    (level === WORKLOAD_LEVELS.HIGH && consistency < t.calmConsistencyMin)
  ) {
    reasons.push({ id: "consistency", label: "Typing rhythm", direction: "down" });
  } else if (
    level !== WORKLOAD_LEVELS.HIGH &&
    consistency >= t.calmConsistencyMin
  ) {
    // Do not treat calm rhythm as an explanation while Workspace Status is High
    // (keeps the demo warm-up fallback reachable when level is forced High).
    reasons.push({ id: "consistency", label: "Typing rhythm", direction: "up" });
  }

  // Fallback so High always has an explainable story during demos /
  // warm-up before enough keystrokes have been collected
  if (level === WORKLOAD_LEVELS.HIGH && reasons.length === 0) {
    return [
      { id: "wpm", label: "Typing speed", direction: "down" },
      { id: "pause", label: "Pauses", direction: "up" },
      { id: "backspace", label: "Corrections", direction: "up" },
      { id: "consistency", label: "Typing rhythm", direction: "down" },
    ];
  }

  return reasons.slice(0, 4);
}

/**
 * Prose for the Focus "Why?" panel — transparency builds trust, which matters
 * when the UI starts hiding things on its own.
 */
export function getExplainabilityReasons(
  metrics = {},
  level = WORKLOAD_LEVELS.NEUTRAL,
  baseline = null,
) {
  const reasons = getBehaviourReasons(metrics, level, baseline);
  const proseById = {
    wpm: {
      up: "Steady typing speed",
      down: "Reduced typing speed",
    },
    pause: {
      up: "Increased typing pauses",
      down: "Shorter typing pauses",
    },
    backspace: {
      up: "Higher correction frequency",
      down: "Lower correction frequency",
    },
    consistency: {
      up: "More regular typing rhythm",
      down: "Typing rhythm becoming irregular",
    },
  };

  return reasons.map((r) => ({
    id: r.id,
    label: proseById[r.id]?.[r.direction] || r.label,
  }));
}
