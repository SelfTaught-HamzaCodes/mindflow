import { describe, it, expect } from "vitest";
import {
  computeTypingMetrics,
  intervalsToConsistency,
  stdDev,
  TYPING_WINDOW_MS,
  WORD_CHARS,
} from "@/lib/typingMetrics";

describe("Behaviour estimation — typing metrics", () => {
  describe("typing speed (WPM)", () => {
    it("computes WPM from characters over the event span", () => {
      // 25 chars spanning 24 × 1200ms = 28.8s → (25/5) / 0.48 min ≈ 10.4 WPM
      const t0 = 1_000_000;
      const events = Array.from({ length: 25 }, (_, i) => ({
        t: t0 + i * 1200,
        type: "char",
        pauseMs: i === 0 ? null : 1200,
      }));
      const metrics = computeTypingMetrics(events, t0 + 24 * 1200);
      expect(metrics.eventCount).toBe(25);
      expect(metrics.wpm).toBe(10.4);
    });

    it("returns 0 WPM when there are no events", () => {
      expect(computeTypingMetrics([], Date.now()).wpm).toBe(0);
    });

    it("uses a minimum span of 1 second so burst typing does not explode WPM", () => {
      const t0 = 2_000_000;
      const events = Array.from({ length: 10 }, (_, i) => ({
        t: t0 + i * 10,
        type: "char",
        pauseMs: i === 0 ? null : 10,
      }));
      const metrics = computeTypingMetrics(events, t0 + 90);
      // span forced to ≥1000ms → 10 chars / 5 / (1/60) = 120 WPM
      expect(metrics.wpm).toBe(120);
    });
  });

  describe("pause duration", () => {
    it("averages non-null inter-key pauses", () => {
      const t0 = 3_000_000;
      const events = [
        { t: t0, type: "char", pauseMs: null },
        { t: t0 + 200, type: "char", pauseMs: 200 },
        { t: t0 + 500, type: "char", pauseMs: 300 },
        { t: t0 + 900, type: "char", pauseMs: 400 },
      ];
      const metrics = computeTypingMetrics(events, t0 + 900);
      expect(metrics.avgPauseMs).toBe(300);
    });

    it("returns 0 avgPauseMs when only the first keystroke exists", () => {
      const t0 = 4_000_000;
      const metrics = computeTypingMetrics(
        [{ t: t0, type: "char", pauseMs: null }],
        t0,
      );
      expect(metrics.avgPauseMs).toBe(0);
    });
  });

  describe("correction frequency (backspace rate)", () => {
    it("computes backspaces / total key events", () => {
      const t0 = 5_000_000;
      const events = [
        { t: t0, type: "char", pauseMs: null },
        { t: t0 + 100, type: "char", pauseMs: 100 },
        { t: t0 + 200, type: "backspace", pauseMs: 100 },
        { t: t0 + 300, type: "char", pauseMs: 100 },
        { t: t0 + 400, type: "backspace", pauseMs: 100 },
      ];
      const metrics = computeTypingMetrics(events, t0 + 400);
      expect(metrics.backspaceRate).toBe(0.4);
    });
  });

  describe("typing consistency", () => {
    it("returns mid consistency (0.5) with fewer than 3 intervals", () => {
      expect(intervalsToConsistency([100, 110])).toBe(0.5);
    });

    it("scores regular intervals highly", () => {
      const regular = [120, 118, 122, 119, 121];
      const score = intervalsToConsistency(regular);
      expect(score).toBeGreaterThan(0.9);
    });

    it("scores irregular intervals lower", () => {
      const irregular = [50, 400, 80, 350, 60];
      const score = intervalsToConsistency(irregular);
      expect(score).toBeLessThan(0.5);
    });

    it("stdDev is 0 for an empty list", () => {
      expect(stdDev([])).toBe(0);
    });

    it("embeds consistency into computeTypingMetrics", () => {
      const t0 = 6_000_000;
      const events = [
        { t: t0, type: "char", pauseMs: null },
        { t: t0 + 100, type: "char", pauseMs: 100 },
        { t: t0 + 200, type: "char", pauseMs: 100 },
        { t: t0 + 300, type: "char", pauseMs: 100 },
        { t: t0 + 400, type: "char", pauseMs: 100 },
      ];
      const metrics = computeTypingMetrics(events, t0 + 400);
      expect(metrics.consistency).toBeGreaterThan(0.9);
    });
  });

  describe("sliding window", () => {
    it("drops events older than the typing window", () => {
      const now = 10_000_000;
      const events = [
        { t: now - TYPING_WINDOW_MS - 1000, type: "char", pauseMs: null },
        { t: now - 1000, type: "char", pauseMs: 100 },
        { t: now - 500, type: "char", pauseMs: 500 },
      ];
      const metrics = computeTypingMetrics(events, now);
      expect(metrics.eventCount).toBe(2);
    });

    it("exposes WORD_CHARS constant used for WPM (standard 5)", () => {
      expect(WORD_CHARS).toBe(5);
    });
  });
});
