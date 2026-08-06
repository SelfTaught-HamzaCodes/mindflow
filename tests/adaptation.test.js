import { describe, it, expect } from "vitest";
import {
  ADAPTATION_BY_LEVEL,
  getAdaptationConfig,
  filterTasks,
  filterEmails,
} from "@/lib/adaptationRules";
import {
  getHiddenAdaptations,
  getExplainabilityReasons,
  getBehaviourReasons,
  FOCUS_SHOWN,
  PANEL_COUNTS,
} from "@/lib/adaptationSummary";
import { WORKLOAD_LEVELS } from "@/lib/constants";

const sampleTasks = [
  {
    id: "t1",
    title: "High today",
    priority: "high",
    status: "todo",
    today: true,
    important: true,
  },
  {
    id: "t2",
    title: "Low task",
    priority: "low",
    status: "todo",
    today: true,
    important: false,
  },
  {
    id: "t3",
    title: "Done important",
    priority: "high",
    status: "done",
    today: true,
    important: true,
  },
  {
    id: "t4",
    title: "Not today",
    priority: "high",
    status: "todo",
    today: false,
    important: true,
  },
];

const sampleEmails = [
  {
    id: "e1",
    subject: "Urgent",
    priority: "high",
    today: true,
    important: true,
  },
  {
    id: "e2",
    subject: "Low",
    priority: "low",
    today: true,
    important: false,
  },
  {
    id: "e3",
    subject: "Old important",
    priority: "high",
    today: false,
    important: true,
  },
];

describe("Interface adaptation", () => {
  describe("Calm layout", () => {
    it("shows analytics, secondary widgets, and low-priority items", () => {
      const cfg = getAdaptationConfig(WORKLOAD_LEVELS.CALM);
      expect(cfg.showAnalytics).toBe(true);
      expect(cfg.showSecondaryWidgets).toBe(true);
      expect(cfg.showLowPriorityTasks).toBe(true);
      expect(cfg.showLowPriorityEmails).toBe(true);
      expect(cfg.increaseWhitespace).toBe(false);
      expect(cfg.highlightPriorities).toBe(false);
      expect(cfg.collapseSidebar).toBe(false);
      expect(cfg.focusModeEligible).toBe(false);
      expect(cfg.visibleNotificationPriorities).toEqual([
        "priority",
        "normal",
        "low",
      ]);
    });

    it("does not filter out low-priority tasks or emails", () => {
      const cfg = getAdaptationConfig(WORKLOAD_LEVELS.CALM);
      expect(filterTasks(sampleTasks, cfg)).toHaveLength(4);
      expect(filterEmails(sampleEmails, cfg)).toHaveLength(3);
    });
  });

  describe("Elevated layout", () => {
    it("keeps major surfaces but emphasises priorities and hides low notifications", () => {
      const cfg = getAdaptationConfig(WORKLOAD_LEVELS.NEUTRAL);
      expect(cfg.showAnalytics).toBe(true);
      expect(cfg.showSecondaryWidgets).toBe(true);
      expect(cfg.highlightPriorities).toBe(true);
      expect(cfg.emphasizeBadges).toBe(true);
      expect(cfg.showSidebarRecommendation).toBe(true);
      expect(cfg.hideLowNotifications).toBe(true);
      expect(cfg.delayNormalNotifications).toBe(false);
      expect(cfg.focusModeEligible).toBe(false);
      expect(cfg.visibleNotificationPriorities).toEqual(["priority", "normal"]);
    });
  });

  describe("High layout", () => {
    it("declutteres secondary surfaces and enables focus eligibility", () => {
      const cfg = getAdaptationConfig(WORKLOAD_LEVELS.HIGH);
      expect(cfg.showAnalytics).toBe(false);
      expect(cfg.showSecondaryWidgets).toBe(false);
      expect(cfg.showLowPriorityTasks).toBe(false);
      expect(cfg.showLowPriorityEmails).toBe(false);
      expect(cfg.increaseWhitespace).toBe(true);
      expect(cfg.expandPriorities).toBe(true);
      expect(cfg.collapseSidebar).toBe(true);
      expect(cfg.delayNormalNotifications).toBe(true);
      expect(cfg.hideLowNotifications).toBe(true);
      expect(cfg.focusModeEligible).toBe(true);
      expect(cfg.visibleNotificationPriorities).toEqual(["priority"]);
    });

    it("hides low-priority tasks and emails under High", () => {
      const cfg = getAdaptationConfig(WORKLOAD_LEVELS.HIGH);
      const tasks = filterTasks(sampleTasks, cfg);
      const emails = filterEmails(sampleEmails, cfg);
      expect(tasks.every((t) => t.priority !== "low")).toBe(true);
      expect(emails.every((e) => e.priority !== "low")).toBe(true);
      expect(tasks).toHaveLength(3);
      expect(emails).toHaveLength(2);
    });

    it("documents hidden adaptations for High", () => {
      const cfg = getAdaptationConfig(WORKLOAD_LEVELS.HIGH);
      const hidden = getHiddenAdaptations(cfg, { focusMode: false });
      const ids = hidden.map((h) => h.id);
      expect(ids).toContain("analytics");
      expect(ids).toContain("calendar");
      expect(ids).toContain("low-tasks");
      expect(ids).toContain("normal-notifications");
      expect(ids).toContain("sidebar");
    });
  });

  describe("Focus Mode activation", () => {
    it("overrides layout to Focus workspace filters when focusMode is true", () => {
      const cfg = getAdaptationConfig(WORKLOAD_LEVELS.HIGH, {
        focusMode: true,
      });
      expect(cfg.focusMode).toBe(true);
      expect(cfg.focusTodayImportantOnly).toBe(true);
      expect(cfg.showAnalytics).toBe(false);
      expect(cfg.showSecondaryWidgets).toBe(false);
      expect(cfg.collapseSidebar).toBe(true);
    });

    it("filters tasks to today && important && not done in Focus Mode", () => {
      const cfg = getAdaptationConfig(WORKLOAD_LEVELS.CALM, {
        focusMode: true,
      });
      const tasks = filterTasks(sampleTasks, cfg);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe("t1");
    });

    it("filters emails to today && important in Focus Mode", () => {
      const cfg = getAdaptationConfig(WORKLOAD_LEVELS.NEUTRAL, {
        focusMode: true,
      });
      const emails = filterEmails(sampleEmails, cfg);
      expect(emails).toHaveLength(1);
      expect(emails[0].id).toBe("e1");
    });

    it("exposes FOCUS_SHOWN messaging for activation overlay", () => {
      expect(FOCUS_SHOWN.length).toBeGreaterThanOrEqual(3);
      expect(PANEL_COUNTS.focus).toBeLessThan(PANEL_COUNTS.full);
    });
  });

  describe("Focus Mode exit", () => {
    it("restores base level config when focusMode is false", () => {
      const calm = getAdaptationConfig(WORKLOAD_LEVELS.CALM, {
        focusMode: false,
      });
      expect(calm.focusMode).toBe(false);
      expect(calm.focusTodayImportantOnly).toBeUndefined();
      expect(calm.showAnalytics).toBe(true);
      expect(calm.showSecondaryWidgets).toBe(true);
    });

    it("ADAPTATION_BY_LEVEL Calm does not mark focus eligible (manual exit restores calm surfaces)", () => {
      expect(ADAPTATION_BY_LEVEL[WORKLOAD_LEVELS.CALM].focusModeEligible).toBe(
        false,
      );
    });
  });

  describe("Explainability panels", () => {
    it("produces prose reasons for High behaviour estimates", () => {
      const reasons = getExplainabilityReasons(
        {
          wpm: 18,
          avgPauseMs: 900,
          backspaceRate: 0.28,
          consistency: 0.2,
        },
        WORKLOAD_LEVELS.HIGH,
      );
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons.some((r) => /typing|pause|correction|rhythm/i.test(r.label))).toBe(
        true,
      );
    });

    it("falls back to a full High explanation story when no directional signals fire", () => {
      // Defaults alone still trigger consistency under High (0.5 < 0.55).
      // Use calm-range values that avoid each individual rule while level=High.
      const reasons = getBehaviourReasons(
        {
          wpm: 55,
          avgPauseMs: 0,
          backspaceRate: 0,
          consistency: 0.55,
        },
        WORKLOAD_LEVELS.HIGH,
      );
      expect(reasons).toHaveLength(4);
      expect(reasons.map((r) => r.id).sort()).toEqual(
        ["backspace", "consistency", "pause", "wpm"].sort(),
      );
    });

    it("still produces at least one High reason from default consistency alone", () => {
      const reasons = getBehaviourReasons({}, WORKLOAD_LEVELS.HIGH);
      expect(reasons.length).toBeGreaterThanOrEqual(1);
      expect(reasons.some((r) => r.id === "consistency")).toBe(true);
    });

    it("reports calm-direction reasons for calm metrics", () => {
      const reasons = getBehaviourReasons(
        {
          wpm: 55,
          avgPauseMs: 200,
          backspaceRate: 0.04,
          consistency: 0.75,
        },
        WORKLOAD_LEVELS.CALM,
      );
      expect(reasons.some((r) => r.direction === "up" || r.direction === "down")).toBe(
        true,
      );
    });
  });
});
