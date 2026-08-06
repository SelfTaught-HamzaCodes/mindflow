/**
 * Align sample JSON timestamps to the real calendar.
 *
 * Sample data is authored around SAMPLE_SCENARIO_TODAY. At runtime we shift
 * every date so scenario "today" becomes the user's actual local today.
 * Without this, demos on a random evaluation day look weirdly "in the past".
 */

/** Authoring anchor used in data/*.json ("today" in the sample story). */
export const SAMPLE_SCENARIO_TODAY = "2026-03-18";

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDateOnly(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatLocalDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Milliseconds to add so scenario today == real today. */
export function getScenarioShiftMs(now = new Date()) {
  const scenario = startOfLocalDay(parseLocalDateOnly(SAMPLE_SCENARIO_TODAY));
  const today = startOfLocalDay(now);
  return today.getTime() - scenario.getTime();
}

export function shiftIso(iso, shiftMs = getScenarioShiftMs()) {
  if (!iso) return iso;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Date(date.getTime() + shiftMs).toISOString();
}

export function shiftDateOnly(yyyyMmDd, shiftMs = getScenarioShiftMs()) {
  if (!yyyyMmDd) return yyyyMmDd;
  const date = parseLocalDateOnly(yyyyMmDd);
  if (Number.isNaN(date.getTime())) return yyyyMmDd;
  return formatLocalDateOnly(new Date(date.getTime() + shiftMs));
}

export function alignEmails(emails, shiftMs = getScenarioShiftMs()) {
  return (emails || []).map((email) => ({
    ...email,
    receivedAt: shiftIso(email.receivedAt, shiftMs),
  }));
}

export function alignTasks(tasks, shiftMs = getScenarioShiftMs()) {
  return (tasks || []).map((task) => ({
    ...task,
    dueDate: shiftDateOnly(task.dueDate, shiftMs),
  }));
}

export function alignNotifications(notifications, shiftMs = getScenarioShiftMs()) {
  return (notifications || []).map((n) => ({
    ...n,
    createdAt: shiftIso(n.createdAt, shiftMs),
  }));
}

export function alignCalendarEvents(events, shiftMs = getScenarioShiftMs()) {
  return (events || []).map((event) => ({
    ...event,
    start: shiftIso(event.start, shiftMs),
    end: shiftIso(event.end, shiftMs),
  }));
}

export function alignActivity(items, shiftMs = getScenarioShiftMs()) {
  return (items || []).map((item) => ({
    ...item,
    createdAt: shiftIso(item.createdAt, shiftMs),
  }));
}
