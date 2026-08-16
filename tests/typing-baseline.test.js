import { describe, it, expect } from "vitest";
import {
  buildTypingBaseline,
  describeTypingBaseline,
  MIN_CALIBRATION_EVENTS,
  summarizeTypingRules,
} from "@/lib/typingBaseline";
import {
  calculateBehaviourState,
  computeLoadScore,
  DEFAULT_SIGNAL_WEIGHTS,
} from "@/lib/workloadEstimator";
import { WORKLOAD_LEVELS } from "@/lib/constants";

/** Fast enough, but lots of corrections — style, not overload. */
const messyTypist = {
  wpm: 40,
  avgPauseMs: 400,
  backspaceRate: 0.22,
  consistency: 0.5,
  eventCount: 40,
};

const highLoad = {
  wpm: 18,
  avgPauseMs: 900,
  backspaceRate: 0.28,
  consistency: 0.2,
  eventCount: 40,
};

describe("Typing baseline personalisation", () => {
  it("needs a minimum sample before building a baseline", () => {
    expect(
      buildTypingBaseline({ ...messyTypist, eventCount: 8 }),
    ).toBeNull();
    expect(MIN_CALIBRATION_EVENTS).toBeGreaterThanOrEqual(12);
  });

  it("lowers backspace weight when the sample already has many corrections", () => {
    const baseline = buildTypingBaseline(messyTypist);
    expect(baseline.weights.backspace).toBeLessThan(
      DEFAULT_SIGNAL_WEIGHTS.backspace,
    );
    expect(baseline.thresholds.calmBackspaceMax).toBeGreaterThan(0.08);
    expect(baseline.thresholds.highBackspaceMin).toBeGreaterThan(0.18);
    expect(describeTypingBaseline(baseline)).toMatch(/correct/i);
  });

  it("does not treat a messy typist's usual corrections as Elevated", () => {
    const baseline = buildTypingBaseline(messyTypist);
    const uncalibrated = calculateBehaviourState(messyTypist);
    const calibrated = calculateBehaviourState(messyTypist, null, baseline);

    expect(uncalibrated.level).toBe(WORKLOAD_LEVELS.NEUTRAL);
    expect(calibrated.level).toBe(WORKLOAD_LEVELS.CALM);
    expect(computeLoadScore(messyTypist, baseline)).toBeLessThan(
      computeLoadScore(messyTypist),
    );
  });

  it("still reaches High when other signals are clearly loaded", () => {
    const baseline = buildTypingBaseline(messyTypist);
    const result = calculateBehaviourState(highLoad, null, baseline);
    expect(result.level).toBe(WORKLOAD_LEVELS.HIGH);
  });

  it("summarises personal rules from the typing sample", () => {
    const baseline = buildTypingBaseline(messyTypist);
    const withSample = summarizeTypingRules(baseline);
    expect(withSample.hasSample).toBe(true);
    expect(withSample.rules.some((r) => /correction weight reduced/i.test(r))).toBe(
      true,
    );
    const without = summarizeTypingRules(null);
    expect(without.hasSample).toBe(false);
    expect(without.summary).toMatch(/default research rules/i);
  });

  it("keeps research default weights when there is no sample", () => {
    expect(computeLoadScore(messyTypist, null)).toBe(
      computeLoadScore(messyTypist),
    );
  });
});
