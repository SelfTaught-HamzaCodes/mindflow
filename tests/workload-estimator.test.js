import { describe, it, expect } from "vitest";
import {
  calculateBehaviourState,
  computeLoadScore,
  scoreToLevel,
  applyHysteresis,
  ESTIMATOR_THRESHOLDS,
} from "@/lib/workloadEstimator";
import { WORKLOAD_LEVELS, WORKLOAD_LABELS } from "@/lib/constants";

/** Representative calm typing profile (enough events to trust estimate). */
const calmMetrics = {
  wpm: 55,
  avgPauseMs: 200,
  backspaceRate: 0.04,
  consistency: 0.75,
  eventCount: 40,
};

/** Representative elevated / mid-load profile. */
const elevatedMetrics = {
  wpm: 36,
  avgPauseMs: 500,
  backspaceRate: 0.12,
  consistency: 0.45,
  eventCount: 40,
};

/** Representative high-load typing profile. */
const highMetrics = {
  wpm: 18,
  avgPauseMs: 900,
  backspaceRate: 0.28,
  consistency: 0.2,
  eventCount: 40,
};

describe("Behaviour estimation — workload score and classification", () => {
  describe("workload score calculation", () => {
    it("returns a score in [0, 1]", () => {
      const score = computeLoadScore(calmMetrics);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it("scores calm profiles lower than high-load profiles", () => {
      expect(computeLoadScore(calmMetrics)).toBeLessThan(
        computeLoadScore(elevatedMetrics),
      );
      expect(computeLoadScore(elevatedMetrics)).toBeLessThan(
        computeLoadScore(highMetrics),
      );
    });

    it("weights pause and backspace as documented (composite increases when they worsen)", () => {
      const base = computeLoadScore({
        wpm: 40,
        avgPauseMs: 400,
        backspaceRate: 0.1,
        consistency: 0.5,
      });
      const longerPauses = computeLoadScore({
        wpm: 40,
        avgPauseMs: 800,
        backspaceRate: 0.1,
        consistency: 0.5,
      });
      const moreCorrections = computeLoadScore({
        wpm: 40,
        avgPauseMs: 400,
        backspaceRate: 0.25,
        consistency: 0.5,
      });
      expect(longerPauses).toBeGreaterThan(base);
      expect(moreCorrections).toBeGreaterThan(base);
    });
  });

  describe("Calm / Elevated / High classification", () => {
    it("maps score < 0.35 to calm", () => {
      expect(scoreToLevel(0)).toBe(WORKLOAD_LEVELS.CALM);
      expect(scoreToLevel(0.34)).toBe(WORKLOAD_LEVELS.CALM);
    });

    it("maps 0.35 ≤ score < 0.65 to neutral (Elevated)", () => {
      expect(scoreToLevel(0.35)).toBe(WORKLOAD_LEVELS.NEUTRAL);
      expect(scoreToLevel(0.64)).toBe(WORKLOAD_LEVELS.NEUTRAL);
    });

    it("maps score ≥ 0.65 to high", () => {
      expect(scoreToLevel(0.65)).toBe(WORKLOAD_LEVELS.HIGH);
      expect(scoreToLevel(1)).toBe(WORKLOAD_LEVELS.HIGH);
    });

    it("labels calm / elevated / high for UI (non-medical wording)", () => {
      expect(WORKLOAD_LABELS.calm).toBe("Calm");
      expect(WORKLOAD_LABELS.neutral).toBe("Elevated");
      expect(WORKLOAD_LABELS.high).toBe("High");
    });

    it("classifyBehaviourState returns Calm for calm metrics", () => {
      const result = calculateBehaviourState(calmMetrics);
      expect(result.insufficientData).toBe(false);
      expect(result.level).toBe(WORKLOAD_LEVELS.CALM);
      expect(result.label).toBe("Calm");
      expect(result.score).toBeLessThan(0.35);
    });

    it("classifyBehaviourState returns Elevated for mid metrics", () => {
      const result = calculateBehaviourState(elevatedMetrics);
      expect(result.level).toBe(WORKLOAD_LEVELS.NEUTRAL);
      expect(result.label).toBe("Elevated");
    });

    it("classifyBehaviourState returns High for high-load metrics", () => {
      const result = calculateBehaviourState(highMetrics);
      expect(result.level).toBe(WORKLOAD_LEVELS.HIGH);
      expect(result.label).toBe("High");
      expect(result.score).toBeGreaterThanOrEqual(0.65);
    });

    it("holds previous level with insufficient event data", () => {
      const result = calculateBehaviourState(
        { ...highMetrics, eventCount: 5 },
        WORKLOAD_LEVELS.CALM,
      );
      expect(result.insufficientData).toBe(true);
      expect(result.level).toBe(WORKLOAD_LEVELS.CALM);
      expect(result.confidence).toBeLessThan(1);
    });

    it("defaults to Elevated when insufficient data and no previous level", () => {
      const result = calculateBehaviourState({ eventCount: 0 });
      expect(result.insufficientData).toBe(true);
      expect(result.level).toBe(WORKLOAD_LEVELS.NEUTRAL);
    });

    it("requires ESTIMATOR_THRESHOLDS.minEvents before trusting estimate", () => {
      expect(ESTIMATOR_THRESHOLDS.minEvents).toBe(12);
    });
  });

  describe("hysteresis behaviour", () => {
    it("keeps previous level when score is only borderline into the next band", () => {
      // Score just inside high (≥0.65) but within hysteresis margin of the band edge
      const next = applyHysteresis(
        WORKLOAD_LEVELS.HIGH,
        WORKLOAD_LEVELS.NEUTRAL,
        0.66,
      );
      expect(next).toBe(WORKLOAD_LEVELS.NEUTRAL);
    });

    it("allows transition when score is clearly inside the new band", () => {
      const next = applyHysteresis(
        WORKLOAD_LEVELS.HIGH,
        WORKLOAD_LEVELS.NEUTRAL,
        0.85,
      );
      expect(next).toBe(WORKLOAD_LEVELS.HIGH);
    });

    it("returns next level unchanged when previous equals next", () => {
      expect(
        applyHysteresis(WORKLOAD_LEVELS.CALM, WORKLOAD_LEVELS.CALM, 0.2),
      ).toBe(WORKLOAD_LEVELS.CALM);
    });

    it("returns next level when there is no previous level", () => {
      expect(applyHysteresis(WORKLOAD_LEVELS.HIGH, null, 0.7)).toBe(
        WORKLOAD_LEVELS.HIGH,
      );
    });

    it("calculateBehaviourState applies hysteresis across successive estimates", () => {
      // First establish elevated
      const elevated = calculateBehaviourState(elevatedMetrics, null);
      expect(elevated.level).toBe(WORKLOAD_LEVELS.NEUTRAL);

      // Borderline high score should not flicker from elevated immediately
      const borderlineHigh = {
        wpm: 30,
        avgPauseMs: 620,
        backspaceRate: 0.16,
        consistency: 0.38,
        eventCount: 40,
      };
      const score = computeLoadScore(borderlineHigh);
      const raw = scoreToLevel(score);
      if (raw === WORKLOAD_LEVELS.HIGH && score < 0.65 + 0.075) {
        const held = calculateBehaviourState(
          borderlineHigh,
          WORKLOAD_LEVELS.NEUTRAL,
        );
        expect(held.level).toBe(WORKLOAD_LEVELS.NEUTRAL);
      }

      // Clear high profile should switch
      const switched = calculateBehaviourState(
        highMetrics,
        WORKLOAD_LEVELS.NEUTRAL,
      );
      expect(switched.level).toBe(WORKLOAD_LEVELS.HIGH);
    });
  });
});
