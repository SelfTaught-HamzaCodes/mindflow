/**
 * Adaptation rules: Estimated Workload → which UI bits stay visible.
 *
 * Whole point of the research question — can behaivoural signals drive
 * interface changes that cut cognitive overload? This table is the answer
 * in code form. Progressive: Elevated nudges emphasis, High actually hides stuff.
 */

import { WORKLOAD_LEVELS } from "./constants";

/**
 * @typedef {object} AdaptationConfig
 * @property {boolean} showAnalytics
 * @property {boolean} showSecondaryWidgets
 * @property {boolean} showLowPriorityTasks
 * @property {boolean} showLowPriorityEmails
 * @property {boolean} increaseWhitespace
 * @property {boolean} highlightPriorities
 * @property {boolean} compactLayout
 * @property {boolean} collapseSidebar
 * @property {string[]} visibleNotificationPriorities
 * @property {boolean} focusModeEligible
 */

/** @type {Record<string, AdaptationConfig>} */
export const ADAPTATION_BY_LEVEL = {
  [WORKLOAD_LEVELS.CALM]: {
    showAnalytics: true,
    showSecondaryWidgets: true,
    showLowPriorityTasks: true,
    showLowPriorityEmails: true,
    increaseWhitespace: false,
    highlightPriorities: false,
    expandPriorities: false,
    emphasizeBadges: false,
    showSidebarRecommendation: false,
    compactLayout: false,
    collapseSidebar: false,
    // three-tier model: priority | normal | low
    visibleNotificationPriorities: ["priority", "normal", "low"],
    delayNormalNotifications: false,
    hideLowNotifications: false,
    focusModeEligible: false,
    showActivityFeed: true,
    showResearchPanel: true,
  },
  // Elevated: push priorities forward but dont rip the dashboard apart yet
  [WORKLOAD_LEVELS.NEUTRAL]: {
    showAnalytics: true,
    showSecondaryWidgets: true,
    showLowPriorityTasks: true,
    showLowPriorityEmails: true,
    increaseWhitespace: false,
    highlightPriorities: true,
    expandPriorities: false,
    emphasizeBadges: true,
    showSidebarRecommendation: true,
    compactLayout: false,
    collapseSidebar: false,
    visibleNotificationPriorities: ["priority", "normal"],
    delayNormalNotifications: false,
    hideLowNotifications: true,
    focusModeEligible: false,
    showActivityFeed: true,
    showResearchPanel: true,
  },
  // High: this is where we actually declutter — secondary surfaces go away
  [WORKLOAD_LEVELS.HIGH]: {
    showAnalytics: false,
    showSecondaryWidgets: false,
    showLowPriorityTasks: false,
    showLowPriorityEmails: false,
    increaseWhitespace: true,
    highlightPriorities: true,
    expandPriorities: true,
    emphasizeBadges: true,
    showSidebarRecommendation: false,
    compactLayout: false,
    collapseSidebar: true,
    // priority stays; normal delayed (see notificationFilter); low hidden
    visibleNotificationPriorities: ["priority"],
    delayNormalNotifications: true,
    hideLowNotifications: true,
    focusModeEligible: true,
    showActivityFeed: false,
    showResearchPanel: false,
  },
};

/**
 * Resolve config for a workload level.
 * Focus Mode overrides go further — research needs a clear "minimum viable workspace".
 */
export function getAdaptationConfig(level, { focusMode = false } = {}) {
  const base =
    ADAPTATION_BY_LEVEL[level] || ADAPTATION_BY_LEVEL[WORKLOAD_LEVELS.NEUTRAL];

  if (!focusMode) return { ...base, focusMode: false };

  return {
    ...base,
    showAnalytics: false,
    showSecondaryWidgets: false,
    showLowPriorityTasks: false,
    showLowPriorityEmails: false,
    increaseWhitespace: true,
    highlightPriorities: true,
    expandPriorities: true,
    emphasizeBadges: true,
    showSidebarRecommendation: false,
    collapseSidebar: true,
    focusMode: true,
    // UI filters to today+important only — thats the Focus Mode contract
    focusTodayImportantOnly: true,
    showActivityFeed: false,
    showResearchPanel: false,
  };
}

/**
 * Task filter — High / Focus drop low priority so the list feels acheivable again.
 */
export function filterTasks(tasks, config) {
  let result = Array.isArray(tasks) ? [...tasks] : [];

  if (config.focusMode || config.focusTodayImportantOnly) {
    result = result.filter(
      (t) => t.today && t.important && t.status !== "done",
    );
    return result;
  }

  if (!config.showLowPriorityTasks) {
    result = result.filter((t) => t.priority !== "low");
  }

  return result;
}

/**
 * Same idea for emails — hiding low-pri under load is the main declutter lever.
 */
export function filterEmails(emails, config) {
  let result = Array.isArray(emails) ? [...emails] : [];

  if (config.focusMode || config.focusTodayImportantOnly) {
    result = result.filter((e) => e.today && e.important);
    return result;
  }

  if (!config.showLowPriorityEmails) {
    result = result.filter((e) => e.priority !== "low");
  }

  return result;
}
