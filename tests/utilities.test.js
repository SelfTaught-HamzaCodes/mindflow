import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  formatDuration,
  formatTime,
  formatRelativeDay,
  priorityLabel,
} from "@/lib/format";
import {
  getScenarioShiftMs,
  shiftIso,
  shiftDateOnly,
  alignEmails,
  alignTasks,
  alignNotifications,
  SAMPLE_SCENARIO_TODAY,
} from "@/lib/alignSampleDates";
import {
  getEmailPriorityReasons,
  isEmailPrioritised,
} from "@/lib/emailPriorityReasons";
import {
  getTaskPriorityReasons,
  getSuggestedFocusTasks,
  formatEffort,
  getTaskEffortMinutes,
  isPriorityTask,
} from "@/lib/taskPriorityReasons";
import {
  bumpSessionMetric,
  loadSessionMetrics,
  recordWorkspaceState,
  buildResearchMetrics,
  formatFocusDuration,
} from "@/lib/researchMetrics";
import { WORKLOAD_LEVELS } from "@/lib/constants";
import { getAdaptationConfig } from "@/lib/adaptationRules";

describe("Utility modules", () => {
  describe("format.js", () => {
    it("formats durations as m:ss and h:mm:ss", () => {
      expect(formatDuration(0)).toBe("0:00");
      expect(formatDuration(65_000)).toBe("1:05");
      expect(formatDuration(3_661_000)).toBe("1:01:01");
    });

    it("formats ISO times in en-GB 24h", () => {
      const out = formatTime("2026-03-18T14:05:00.000Z");
      expect(out).toMatch(/^\d{2}:\d{2}$/);
    });

    it("returns empty string for missing time", () => {
      expect(formatTime(null)).toBe("");
    });

    it("labels relative days", () => {
      const today = new Date();
      expect(formatRelativeDay(today.toISOString())).toBe("Today");
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      expect(formatRelativeDay(yesterday.toISOString())).toBe("Yesterday");
    });

    it("capitalises priority labels", () => {
      expect(priorityLabel("high")).toBe("High");
      expect(priorityLabel(null)).toBe("Normal");
    });
  });

  describe("alignSampleDates.js", () => {
    it("shifts scenario today to the real calendar day", () => {
      const fixedNow = new Date(2026, 7, 6); // 6 Aug 2026 local
      const shift = getScenarioShiftMs(fixedNow);
      const scenario = new Date(SAMPLE_SCENARIO_TODAY + "T00:00:00");
      // shiftDateOnly should map SAMPLE_SCENARIO_TODAY → 2026-08-06
      expect(shiftDateOnly(SAMPLE_SCENARIO_TODAY, shift)).toBe("2026-08-06");
      expect(shift).toBeGreaterThan(0);
      void scenario;
    });

    it("aligns email / task / notification dates", () => {
      const shift = getScenarioShiftMs(new Date(2026, 7, 6));
      const emails = alignEmails(
        [{ id: "1", receivedAt: "2026-03-18T10:00:00.000Z" }],
        shift,
      );
      const tasks = alignTasks([{ id: "1", dueDate: "2026-03-18" }], shift);
      const notes = alignNotifications(
        [{ id: "1", createdAt: "2026-03-18T10:00:00.000Z" }],
        shift,
      );
      expect(emails[0].receivedAt).not.toBe("2026-03-18T10:00:00.000Z");
      expect(tasks[0].dueDate).toBe("2026-08-06");
      expect(notes[0].createdAt).toBe(shiftIso("2026-03-18T10:00:00.000Z", shift));
    });
  });

  describe("emailPriorityReasons.js", () => {
    it("returns explainable reasons for prioritised email", () => {
      const reasons = getEmailPriorityReasons({
        today: true,
        important: true,
        priority: "high",
        unread: true,
      });
      expect(reasons.map((r) => r.id)).toEqual(
        expect.arrayContaining(["today", "importance", "awaiting", "priority", "focus"]),
      );
      expect(isEmailPrioritised({ important: true })).toBe(true);
      expect(isEmailPrioritised(null)).toBe(false);
    });
  });

  describe("taskPriorityReasons.js", () => {
    it("returns effort estimates and priority reasons", () => {
      expect(getTaskEffortMinutes({ effortMinutes: 25 })).toBe(25);
      expect(getTaskEffortMinutes({ priority: "high" })).toBe(20);
      expect(formatEffort(15)).toBe("15 min");
      const reasons = getTaskPriorityReasons({
        today: true,
        priority: "high",
        important: true,
        status: "todo",
        meetingRelated: true,
        category: "Sales",
      });
      expect(reasons.length).toBeGreaterThan(2);
      expect(isPriorityTask({ status: "todo", important: true })).toBe(true);
    });

    it("suggests top focus tasks for today", () => {
      const suggested = getSuggestedFocusTasks(
        [
          {
            id: "a",
            status: "todo",
            important: true,
            priority: "high",
            today: true,
          },
          {
            id: "b",
            status: "done",
            important: true,
            priority: "high",
            today: true,
          },
          {
            id: "c",
            status: "todo",
            important: true,
            priority: "medium",
            today: true,
          },
        ],
        2,
      );
      expect(suggested[0].id).toBe("a");
      expect(suggested).toHaveLength(2);
    });
  });

  describe("researchMetrics.js", () => {
    beforeEach(() => {
      window.sessionStorage.clear();
    });

    it("bumps and persists session counters", () => {
      bumpSessionMetric("focusActivations", 1);
      bumpSessionMetric("focusActivations", 2);
      const session = loadSessionMetrics();
      expect(session.focusActivations).toBe(3);
    });

    it("deduplicates consecutive workspace-state labels", () => {
      recordWorkspaceState("Calm", "level");
      recordWorkspaceState("Calm", "level");
      const session = loadSessionMetrics();
      const calmEvents = session.stateTimeline.filter((e) => e.label === "Calm");
      // Fresh load starts with Calm; second identical record should not grow
      expect(calmEvents.length).toBe(1);
    });

    it("builds research metrics aggregating adaptations", () => {
      const metrics = buildResearchMetrics({
        emails: [
          { id: "1", important: true, priority: "high", today: true },
          { id: "2", important: false, priority: "low", today: true },
        ],
        tasks: [
          {
            id: "t1",
            status: "done",
            today: true,
            important: true,
            priority: "high",
          },
        ],
        notifications: [
          {
            id: "n1",
            priority: "low",
            createdAt: "2026-03-18T10:00:00.000Z",
            read: false,
          },
        ],
        adaptation: getAdaptationConfig(WORKLOAD_LEVELS.HIGH),
        level: WORKLOAD_LEVELS.HIGH,
        focusMode: true,
        session: {
          focusActivations: 2,
          breakSuggestionsAccepted: 1,
          breakSuggestionsDismissed: 0,
          draftsSaved: 0,
          stateTimeline: [{ at: new Date().toISOString(), label: "High" }],
          longestFocusStreakMin: 12,
        },
        highLoadStartedAt: Date.now() - 5 * 60_000,
      });
      expect(metrics.emailsHidden).toBeGreaterThanOrEqual(1);
      expect(metrics.focusSessions).toBe(2);
      expect(metrics.adaptiveActions.length).toBeGreaterThan(0);
      expect(formatFocusDuration(75)).toBe("1h 15m");
      expect(formatFocusDuration(0)).toBe("0m");
    });
  });
});
