/**
 * Notification filtering for Estimated Workload.
 *
 * Idea: not all interruptions are equal. Under High we keep Priority,
 * delay Normal (give the user a breather), and hide Low entirely.
 * 45s delay is long enough to notice in a demo, short enough that
 * normals still recieve eventually.
 *
 * Legacy urgent/high/medium values get normalised so old sample JSON still works.
 */

import { WORKLOAD_LEVELS } from "./constants";

export const NOTIFICATION_PRIORITIES = {
  PRIORITY: "priority",
  NORMAL: "normal",
  LOW: "low",
};

/** How long normals sit in limbo under High — shortened by demo speed */
export const NORMAL_DELAY_MS = 45000;

const LEGACY_PRIORITY_MAP = {
  urgent: NOTIFICATION_PRIORITIES.PRIORITY,
  high: NOTIFICATION_PRIORITIES.PRIORITY,
  priority: NOTIFICATION_PRIORITIES.PRIORITY,
  medium: NOTIFICATION_PRIORITIES.NORMAL,
  normal: NOTIFICATION_PRIORITIES.NORMAL,
  low: NOTIFICATION_PRIORITIES.LOW,
};

export const PRIORITY_LABELS = {
  priority: "Priority",
  normal: "Normal",
  low: "Low",
};

/**
 * Normalise any stored priority string to priority | normal | low.
 */
export function normalizePriority(priority) {
  return LEGACY_PRIORITY_MAP[priority] || NOTIFICATION_PRIORITIES.NORMAL;
}

/**
 * Sort: unread first, then priority rank, then newest.
 */
export function sortNotifications(notifications) {
  const rank = {
    [NOTIFICATION_PRIORITIES.PRIORITY]: 0,
    [NOTIFICATION_PRIORITIES.NORMAL]: 1,
    [NOTIFICATION_PRIORITIES.LOW]: 2,
  };

  return [...(notifications || [])].sort((a, b) => {
    if (Boolean(a.read) !== Boolean(b.read)) return a.read ? 1 : -1;
    const pa = normalizePriority(a.priority);
    const pb = normalizePriority(b.priority);
    const pr = (rank[pa] ?? 9) - (rank[pb] ?? 9);
    if (pr !== 0) return pr;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Classify notifications for the current behaviour estimate.
 *
 * @returns {{ visible: Array, delayed: Array, hidden: Array, policy: object }}
 */
export function classifyNotifications(
  notifications,
  workloadLevel,
  {
    focusMode = false,
    highLoadStartedAt = null,
    now = Date.now(),
    demoSpeed = 1,
  } = {},
) {
  const highLoad =
    workloadLevel === WORKLOAD_LEVELS.HIGH || Boolean(focusMode);
  const speed = Math.max(1, Number(demoSpeed) || 1);
  const effectiveDelayMs = NORMAL_DELAY_MS / speed;

  const visible = [];
  const delayed = [];
  const hidden = [];

  for (const raw of notifications || []) {
    const priority = normalizePriority(raw.priority);
    const item = { ...raw, priority };

    // Calm + no focus = full interruptibility, nothing to adapt
    if (workloadLevel === WORKLOAD_LEVELS.CALM && !focusMode) {
      visible.push(item);
      continue;
    }

    // Elevated: drop the noisy lows, keep everything else immediate
    if (workloadLevel === WORKLOAD_LEVELS.NEUTRAL && !focusMode) {
      if (priority === NOTIFICATION_PRIORITIES.LOW) {
        hidden.push({ ...item, reason: "hidden_low" });
      } else {
        visible.push(item);
      }
      continue;
    }

    // High / Focus — this is the interesting case for the RQ
    if (priority === NOTIFICATION_PRIORITIES.PRIORITY) {
      visible.push(item);
      continue;
    }

    if (priority === NOTIFICATION_PRIORITIES.LOW) {
      hidden.push({ ...item, reason: "hidden_low" });
      continue;
    }

    // Normal waits untill releaseAt; demoSpeed shortens the wait for examiners
    const startedAt = highLoadStartedAt ?? now;
    const releaseAt = startedAt + effectiveDelayMs;

    if (!highLoad || now >= releaseAt) {
      visible.push({ ...item, wasDelayed: highLoad });
    } else {
      delayed.push({
        ...item,
        releaseAt,
        remainingMs: Math.max(0, releaseAt - now),
        reason: "delayed_normal",
      });
    }
  }

  return {
    visible: sortNotifications(visible),
    delayed: sortNotifications(delayed),
    hidden,
    policy: {
      highLoad,
      normalDelayMs: NORMAL_DELAY_MS,
      effectiveDelayMs,
      rules: highLoad
        ? "Keep priority · Delay normal · Hide low"
        : workloadLevel === WORKLOAD_LEVELS.NEUTRAL
          ? "Show priority + normal · Hide low"
          : "Show all",
    },
  };
}

/**
 * Backward-compatible helper used by older call sites.
 * Returns only currently visible notifications.
 */
export function filterNotifications(
  notifications,
  workloadLevel,
  options = {},
) {
  return classifyNotifications(notifications, workloadLevel, options).visible;
}
