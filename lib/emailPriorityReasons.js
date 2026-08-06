/**
 * Explainable reasons an email is prioritised in the adaptive inbox.
 * Heuristic / rule-based - not AI scoring of content.
 */

export function getEmailPriorityReasons(email) {
  if (!email) return [];

  const reasons = [];

  if (email.today) {
    reasons.push({ id: "today", label: "Due today" });
  }
  if (email.important || email.priority === "high") {
    reasons.push({ id: "importance", label: "High importance" });
  }
  if (email.unread && (email.important || email.priority === "high")) {
    reasons.push({ id: "awaiting", label: "Awaiting response" });
  }
  if (email.priority === "high") {
    reasons.push({ id: "priority", label: "Marked high priority" });
  }
  if (email.today && email.important) {
    reasons.push({ id: "focus", label: "Kept visible in Focus Mode" });
  }

  // Deduplicate by id
  const seen = new Set();
  return reasons.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export function isEmailPrioritised(email) {
  return Boolean(
    email &&
      (email.important || email.priority === "high" || (email.today && email.important)),
  );
}
