import { describe, it, expect } from "vitest";
import {
  classifyNotifications,
  filterNotifications,
  normalizePriority,
  sortNotifications,
  NORMAL_DELAY_MS,
  NOTIFICATION_PRIORITIES,
} from "@/lib/notificationFilter";
import { WORKLOAD_LEVELS } from "@/lib/constants";

const notifications = [
  {
    id: "p1",
    title: "Priority",
    priority: "priority",
    createdAt: "2026-03-18T12:00:00.000Z",
    read: false,
  },
  {
    id: "n1",
    title: "Normal",
    priority: "normal",
    createdAt: "2026-03-18T11:00:00.000Z",
    read: false,
  },
  {
    id: "l1",
    title: "Low",
    priority: "low",
    createdAt: "2026-03-18T10:00:00.000Z",
    read: false,
  },
  {
    id: "legacy",
    title: "Legacy urgent",
    priority: "urgent",
    createdAt: "2026-03-18T09:00:00.000Z",
    read: false,
  },
];

describe("Notification filtering", () => {
  describe("priority normalisation", () => {
    it("maps legacy urgent/high to priority", () => {
      expect(normalizePriority("urgent")).toBe(NOTIFICATION_PRIORITIES.PRIORITY);
      expect(normalizePriority("high")).toBe(NOTIFICATION_PRIORITIES.PRIORITY);
    });

    it("maps medium to normal and unknown to normal", () => {
      expect(normalizePriority("medium")).toBe(NOTIFICATION_PRIORITIES.NORMAL);
      expect(normalizePriority("weird")).toBe(NOTIFICATION_PRIORITIES.NORMAL);
    });
  });

  describe("Calm — all priorities visible", () => {
    it("shows priority, normal, and low under Calm", () => {
      const { visible, delayed, hidden, policy } = classifyNotifications(
        notifications,
        WORKLOAD_LEVELS.CALM,
      );
      expect(visible).toHaveLength(4);
      expect(delayed).toHaveLength(0);
      expect(hidden).toHaveLength(0);
      expect(policy.rules).toBe("Show all");
    });
  });

  describe("Elevated — low hidden", () => {
    it("hides low and shows priority + normal immediately", () => {
      const { visible, delayed, hidden, policy } = classifyNotifications(
        notifications,
        WORKLOAD_LEVELS.NEUTRAL,
      );
      expect(visible.map((n) => n.id).sort()).toEqual(
        ["legacy", "n1", "p1"].sort(),
      );
      expect(hidden).toHaveLength(1);
      expect(hidden[0].id).toBe("l1");
      expect(hidden[0].reason).toBe("hidden_low");
      expect(delayed).toHaveLength(0);
      expect(policy.rules).toBe("Show priority + normal · Hide low");
    });
  });

  describe("priority notifications under High", () => {
    it("keeps priority notifications visible under High load", () => {
      const { visible } = classifyNotifications(
        notifications,
        WORKLOAD_LEVELS.HIGH,
        { highLoadStartedAt: 1_000_000, now: 1_000_000 },
      );
      const ids = visible.map((n) => n.id);
      expect(ids).toContain("p1");
      expect(ids).toContain("legacy");
    });
  });

  describe("delayed notifications", () => {
    it("delays normal notifications under High until release time", () => {
      const started = 2_000_000;
      const { visible, delayed } = classifyNotifications(
        notifications,
        WORKLOAD_LEVELS.HIGH,
        { highLoadStartedAt: started, now: started + 1000 },
      );
      expect(delayed.some((n) => n.id === "n1")).toBe(true);
      expect(delayed.find((n) => n.id === "n1").reason).toBe("delayed_normal");
      expect(visible.some((n) => n.id === "n1")).toBe(false);
      expect(NORMAL_DELAY_MS).toBe(45000);
    });

    it("releases delayed normal notifications after the delay elapses", () => {
      const started = 3_000_000;
      const { visible, delayed } = classifyNotifications(
        notifications,
        WORKLOAD_LEVELS.HIGH,
        {
          highLoadStartedAt: started,
          now: started + NORMAL_DELAY_MS,
        },
      );
      expect(delayed.some((n) => n.id === "n1")).toBe(false);
      const released = visible.find((n) => n.id === "n1");
      expect(released).toBeTruthy();
      expect(released.wasDelayed).toBe(true);
    });

    it("shortens delay with demoSpeed for viva demos", () => {
      const started = 4_000_000;
      const { delayed } = classifyNotifications(
        notifications,
        WORKLOAD_LEVELS.HIGH,
        {
          highLoadStartedAt: started,
          now: started + 1000,
          demoSpeed: 30,
        },
      );
      const normal = delayed.find((n) => n.id === "n1");
      expect(normal.releaseAt).toBe(started + NORMAL_DELAY_MS / 30);
    });
  });

  describe("hidden notifications", () => {
    it("hides low notifications under High and Focus Mode", () => {
      const high = classifyNotifications(notifications, WORKLOAD_LEVELS.HIGH, {
        highLoadStartedAt: 5_000_000,
        now: 5_000_000,
      });
      expect(high.hidden.some((n) => n.id === "l1")).toBe(true);

      const focus = classifyNotifications(
        notifications,
        WORKLOAD_LEVELS.CALM,
        { focusMode: true, highLoadStartedAt: 5_000_000, now: 5_000_000 },
      );
      expect(focus.hidden.some((n) => n.id === "l1")).toBe(true);
      expect(focus.policy.highLoad).toBe(true);
    });
  });

  describe("countdown timer (remainingMs)", () => {
    it("exposes remainingMs on delayed normal items for UI countdown", () => {
      const started = 6_000_000;
      const now = started + 10_000;
      const { delayed } = classifyNotifications(
        notifications,
        WORKLOAD_LEVELS.HIGH,
        { highLoadStartedAt: started, now },
      );
      const normal = delayed.find((n) => n.id === "n1");
      expect(normal.remainingMs).toBe(NORMAL_DELAY_MS - 10_000);
      expect(normal.releaseAt).toBe(started + NORMAL_DELAY_MS);
    });

    it("clamps remainingMs to ≥ 0", () => {
      const started = 7_000_000;
      // still treated as delayed only if now < release; use just before release
      const { delayed } = classifyNotifications(
        notifications,
        WORKLOAD_LEVELS.HIGH,
        {
          highLoadStartedAt: started,
          now: started + NORMAL_DELAY_MS - 1,
        },
      );
      const normal = delayed.find((n) => n.id === "n1");
      expect(normal.remainingMs).toBe(1);
    });
  });

  describe("filterNotifications helper", () => {
    it("returns only the visible list for backward compatibility", () => {
      const visible = filterNotifications(notifications, WORKLOAD_LEVELS.CALM);
      expect(visible).toHaveLength(4);
    });
  });

  describe("sortNotifications", () => {
    it("orders unread before read, then by priority rank, then newest", () => {
      const sorted = sortNotifications([
        {
          id: "a",
          priority: "low",
          read: false,
          createdAt: "2026-03-18T08:00:00.000Z",
        },
        {
          id: "b",
          priority: "priority",
          read: true,
          createdAt: "2026-03-18T12:00:00.000Z",
        },
        {
          id: "c",
          priority: "priority",
          read: false,
          createdAt: "2026-03-18T11:00:00.000Z",
        },
      ]);
      expect(sorted.map((n) => n.id)).toEqual(["c", "a", "b"]);
    });
  });
});
