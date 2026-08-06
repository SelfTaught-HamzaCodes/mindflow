/**
 * Shared constants for the Mindflow research prototype.
 * Labels deliberately avoid medical wording ("stress", "anxiety", etc) —
 * ethics review was clearer when everything stays behavioural.
 */

export const WORKLOAD_LEVELS = {
  CALM: "calm",
  NEUTRAL: "neutral",
  HIGH: "high",
};

/**
 * UI labels. "neutral" renders as Elevated on purpose — "Neutral" sounded
 * too flat in pilots and examiners kept asking what it meant.
 */
export const WORKLOAD_LABELS = {
  calm: "Calm",
  neutral: "Elevated",
  high: "High",
};

/** Dashboard-facing title — "Workspace Status" reads less clinical than "Workload" */
export const WORKSPACE_STATUS_TITLE = "Workspace Status";

/** Research-facing title for panels / dissertation materials */
export const WORKLOAD_UI_TITLE = "Estimated Workload";

export const DEMO_USER = {
  name: "Alex Chen",
  role: "Sales Coordinator",
  organisation: "Northwind Office",
  email: "alex.chen@northwind.co",
  avatarInitials: "AC",
};
