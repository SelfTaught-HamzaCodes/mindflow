/**
 * Research-oriented metrics for Behaviour Insights + Daily Reflection.
 * Mixes live sample data with lightweight session counters so the Insights
 * page isnt empty the first 30 seconds of a demo.
 */

import { classifyNotifications } from "./notificationFilter";
import { filterEmails, filterTasks } from "./adaptationRules";
import { WORKLOAD_LABELS } from "./constants";

const STORAGE_KEY = "mindflow-session-metrics";

const defaultSession = {
  focusActivations: 0,
  breakSuggestionsAccepted: 0,
  breakSuggestionsDismissed: 0,
  draftsSaved: 0,
  dayStartedAt: null,
  stateTimeline: [],
  longestFocusStreakMin: 0,
};

export function loadSessionMetrics() {
  if (typeof window === "undefined") return { ...defaultSession };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = {
        ...defaultSession,
        dayStartedAt: new Date().toISOString(),
        stateTimeline: [
          {
            at: new Date().toISOString(),
            label: "Calm",
            kind: "level",
          },
        ],
      };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return { ...defaultSession, ...JSON.parse(raw) };
  } catch {
    return {
      ...defaultSession,
      dayStartedAt: new Date().toISOString(),
      stateTimeline: [],
    };
  }
}

function persistSession(next) {
  if (typeof window === "undefined") return next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function bumpSessionMetric(key, amount = 1) {
  const current = loadSessionMetrics();
  const next = {
    ...current,
    [key]: Math.max(0, (current[key] || 0) + amount),
  };
  return persistSession(next);
}

/**
 * Append a workspace-state timeline event (deduped if unchanged).
 */
export function recordWorkspaceState(label, kind = "level") {
  const current = loadSessionMetrics();
  const timeline = Array.isArray(current.stateTimeline)
    ? [...current.stateTimeline]
    : [];
  const last = timeline[timeline.length - 1];
  if (last?.label === label) return current;

  timeline.push({
    at: new Date().toISOString(),
    label,
    kind,
  });

  let longest = current.longestFocusStreakMin || 0;
  if (label === "Focus Mode" && last?.at) {
    // closing previous non-focus segment - no-op
  }
  if (last?.label === "Focus Mode" && last?.at) {
    const mins = Math.max(
      1,
      Math.round((Date.now() - new Date(last.at).getTime()) / 60000),
    );
    longest = Math.max(longest, mins);
  }

  return persistSession({
    ...current,
    stateTimeline: timeline.slice(-12),
    longestFocusStreakMin: longest,
  });
}

function formatClock(iso) {
  if (!iso) return "--:--";
  try {
    // Fixed locale + 24h so SSR and the browser never disagree (e.g. "02:34" vs "02:34 AM").
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return "--:--";
  }
}

function distributionBars(timeline, level) {
  const counts = { Calm: 1, Elevated: 0, High: 0 };
  for (const event of timeline || []) {
    if (event.label === "Calm") counts.Calm += 1;
    if (event.label === "Elevated") counts.Elevated += 1;
    if (
      event.label === "High" ||
      event.label === "Focus Mode" ||
      (typeof event.label === "string" && event.label.includes("High"))
    ) {
      counts.High += 1;
    }
  }
  // Bias toward current state so the bars feel live during a viva walkthrough
  if (level === "calm") counts.Calm += 2;
  if (level === "neutral") counts.Elevated += 2;
  if (level === "high") counts.High += 2;

  const max = Math.max(1, counts.Calm, counts.Elevated, counts.High);
  const toFilled = (n) => Math.max(0, Math.min(8, Math.round((n / max) * 8)));

  return {
    calm: toFilled(counts.Calm),
    elevated: toFilled(counts.Elevated),
    high: toFilled(counts.High),
  };
}

/**
 * Build dissertation-friendly analytics from current prototype state.
 * Numbers are indicative (session heuristics), not clinical measures —
 * thats intentional for the evaluation framing.
 */
export function buildResearchMetrics({
  emails = [],
  tasks = [],
  notifications = [],
  adaptation = {},
  level = "neutral",
  focusMode = false,
  session = defaultSession,
  highLoadStartedAt = null,
}) {
  const visibleEmails = filterEmails(emails, adaptation);
  const hiddenEmails = Math.max(0, emails.length - visibleEmails.length);
  const prioritisedEmails = emails.filter(
    (e) => e.important || e.priority === "high",
  ).length;

  const visibleTasks = filterTasks(tasks, adaptation);
  const completedToday = tasks.filter(
    (t) => t.status === "done" && (t.today || t.important),
  ).length;
  const openPriorityTasks = visibleTasks.filter((t) => t.status !== "done").length;

  const { delayed, hidden } = classifyNotifications(notifications, level, {
    focusMode,
    highLoadStartedAt,
    now: Date.now(),
  });

  const notificationsDeferred = delayed.length + hidden.length;
  const timeline = session.stateTimeline || [];
  const workloadBars = distributionBars(timeline, level);

  const focusMinutes =
    Math.max(0, session.focusActivations) * 18 +
    (highLoadStartedAt
      ? Math.min(45, Math.round((Date.now() - highLoadStartedAt) / 60000))
      : 0);
  const estimatedFocusMinutes =
    focusMinutes || (focusMode ? 25 : session.focusActivations > 0 ? 18 : 12);

  const longestSessionMinutes = Math.max(
    session.longestFocusStreakMin || 0,
    focusMode && highLoadStartedAt
      ? Math.min(46, Math.round((Date.now() - highLoadStartedAt) / 60000) || 12)
      : 0,
    session.focusActivations > 0 ? 22 : 0,
    estimatedFocusMinutes > 0 ? Math.min(46, Math.round(estimatedFocusMinutes * 0.35)) : 0,
  );

  const adaptiveActions = [];
  if (prioritisedEmails > 0) {
    adaptiveActions.push(
      `Prioritised ${Math.min(prioritisedEmails, visibleEmails.length || prioritisedEmails)} urgent emails`,
    );
  }
  if (notificationsDeferred > 0) {
    adaptiveActions.push(
      `Delayed ${notificationsDeferred} notification${notificationsDeferred === 1 ? "" : "s"}`,
    );
  }
  if (session.focusActivations > 0) {
    adaptiveActions.push(
      `Reduced dashboard to Focus Mode ${session.focusActivations} time${session.focusActivations === 1 ? "" : "s"}`,
    );
  }
  if (session.breakSuggestionsAccepted > 0) {
    adaptiveActions.push(
      `Accepted ${session.breakSuggestionsAccepted} wellbeing reset${session.breakSuggestionsAccepted === 1 ? "" : "s"}`,
    );
  } else if (session.breakSuggestionsDismissed > 0) {
    adaptiveActions.push("Surfaced a Focus Reset suggestion");
  }
  if (hiddenEmails > 0) {
    adaptiveActions.push(
      `Temporarily hid ${hiddenEmails} low-priority email${hiddenEmails === 1 ? "" : "s"}`,
    );
  }
  if (session.draftsSaved > 0) {
    adaptiveActions.push(
      `Saved ${session.draftsSaved} draft recovery suggestion${session.draftsSaved === 1 ? "" : "s"}`,
    );
  }
  if (level === "calm" && session.focusActivations > 0) {
    adaptiveActions.push("Restored fuller workspace when demand eased");
  }
  if (adaptiveActions.length === 0) {
    adaptiveActions.push("Monitoring interaction behaviour for adaptive changes");
  }

  const timelineRows = (timeline.length
    ? timeline
    : [{ at: null, label: WORKLOAD_LABELS[level] || "Calm" }]
  ).map((event) => ({
    time: formatClock(event.at),
    label: event.label,
  }));

  return {
    level,
    focusMode,
    workloadBars,
    timelineRows,
    focusSessions: session.focusActivations,
    emailsPrioritised: prioritisedEmails,
    emailsVisible: visibleEmails.length,
    emailsHidden: hiddenEmails,
    emailsTotal: emails.length,
    notificationsDelayed: notificationsDeferred,
    notificationsHidden: hidden.length,
    breakSuggestionsAccepted: session.breakSuggestionsAccepted,
    breakSuggestionsDismissed: session.breakSuggestionsDismissed,
    draftsSaved: session.draftsSaved,
    priorityTasksCompleted: completedToday,
    openPriorityTasks,
    estimatedFocusMinutes,
    longestSessionMinutes: Math.max(longestSessionMinutes, 8),
    adaptiveActions: adaptiveActions.slice(0, 6),
    adaptationsCount:
      session.focusActivations +
      (hiddenEmails > 0 ? 1 : 0) +
      (notificationsDeferred > 0 ? 1 : 0) +
      session.breakSuggestionsAccepted,
  };
}

export function formatFocusDuration(minutes) {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
