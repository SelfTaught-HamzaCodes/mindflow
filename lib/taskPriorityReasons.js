/**
 * Explainable reasons a task is prioritised - rule-based, not AI content scoring.
 */

export function getTaskEffortMinutes(task) {
  if (!task) return 15;
  if (typeof task.effortMinutes === "number") return task.effortMinutes;
  if (task.priority === "high") return 20;
  if (task.priority === "low") return 10;
  return 15;
}

export function formatEffort(minutes) {
  if (!minutes) return "";
  return `${minutes} min`;
}

export function getTaskPriorityReasons(task) {
  if (!task) return [];
  const reasons = [];

  if (task.today) {
    reasons.push({ id: "today", label: "Due today" });
  }
  if (task.priority === "high" || task.important) {
    reasons.push({ id: "importance", label: "High importance" });
  }
  if (task.status !== "done") {
    reasons.push({ id: "awaiting", label: "Awaiting completion" });
  }
  if (task.meetingRelated) {
    reasons.push({ id: "meeting", label: "Required for meeting" });
  }
  if (task.priority === "high" && task.today) {
    reasons.push({ id: "soon", label: "Due within the working day" });
  }
  if (task.category === "Sales" && task.important) {
    reasons.push({ id: "pipeline", label: "Linked to active pipeline work" });
  }

  const seen = new Set();
  return reasons.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export function isPriorityTask(task) {
  return Boolean(
    task &&
      task.status !== "done" &&
      (task.important || task.priority === "high" || (task.today && task.important)),
  );
}

/** Top suggested focus tasks for the recommendation panel. */
export function getSuggestedFocusTasks(tasks, limit = 3) {
  return [...(tasks || [])]
    .filter((t) => t.status !== "done" && (t.important || t.priority === "high") && t.today)
    .sort((a, b) => {
      const rank = (t) =>
        (t.priority === "high" ? 2 : 0) + (t.important ? 1 : 0);
      return rank(b) - rank(a);
    })
    .slice(0, limit);
}
