import { describe, it, expect, beforeEach } from "vitest";
import {
  applyPreferenceSignal,
  applyUserPrefs,
  completeOnboarding,
  createPrefs,
  patchUserPrefs,
  DENSITY,
  firstNameFromUser,
  loadUserPrefs,
  overlayDisplayUser,
  wellnessTriggerMsForPrefs,
  BREAKS,
  INTERRUPTIONS,
  PRIMARY_FOCUS,
} from "@/lib/userPrefs";
import { getAdaptationConfig } from "@/lib/adaptationRules";
import { WORKLOAD_LEVELS } from "@/lib/constants";

describe("userPrefs", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts not onboarded and persists completed answers", () => {
    expect(loadUserPrefs().onboarded).toBe(false);
    const saved = completeOnboarding({
      displayName: "Sam",
      density: DENSITY.QUIET,
      interruptions: INTERRUPTIONS.QUIET,
      breaks: BREAKS.RARELY,
      primaryFocus: PRIMARY_FOCUS.TASKS,
    });
    expect(saved.onboarded).toBe(true);
    expect(saved.displayName).toBe("Sam");
    expect(loadUserPrefs().primaryFocus).toBe(PRIMARY_FOCUS.TASKS);
    expect(saved.typingBaseline).toBeNull();
  });

  it("persists a typing baseline from onboarding", () => {
    const typingBaseline = {
      eventCount: 24,
      backspaceRate: 0.2,
      weights: { wpm: 0.3, pause: 0.35, backspace: 0.12, consistency: 0.23 },
      thresholds: { calmBackspaceMax: 0.23, highBackspaceMin: 0.33 },
    };
    const saved = completeOnboarding({
      density: DENSITY.QUIET,
      typingBaseline,
    });
    expect(saved.typingBaseline.backspaceRate).toBe(0.2);
    expect(loadUserPrefs().typingBaseline.weights.backspace).toBe(0.12);
  });

  it("quiet prefs hide extra Calm surfaces without re-showing High-hidden ones", () => {
    const quiet = createPrefs({
      onboarded: true,
      density: DENSITY.QUIET,
      interruptions: INTERRUPTIONS.QUIET,
      primaryFocus: PRIMARY_FOCUS.PRIORITIES,
    });
    const calm = applyUserPrefs(
      getAdaptationConfig(WORKLOAD_LEVELS.CALM),
      quiet,
    );
    expect(calm.showAnalytics).toBe(false);
    expect(calm.showSecondaryWidgets).toBe(false);
    expect(calm.showActivityFeed).toBe(false);
    expect(calm.visibleNotificationPriorities).toEqual(["priority"]);

    const high = applyUserPrefs(
      getAdaptationConfig(WORKLOAD_LEVELS.HIGH),
      createPrefs({ onboarded: true, density: DENSITY.FULL }),
    );
    expect(high.showAnalytics).toBe(false);
    expect(high.showSecondaryWidgets).toBe(false);
  });

  it("keeps calendar on a quiet layout when that is the primary focus", () => {
    const prefs = createPrefs({
      onboarded: true,
      density: DENSITY.QUIET,
      primaryFocus: PRIMARY_FOCUS.CALENDAR,
    });
    const calm = applyUserPrefs(
      getAdaptationConfig(WORKLOAD_LEVELS.CALM),
      prefs,
    );
    expect(calm.showSecondaryWidgets).toBe(true);
    expect(calm.showActivityFeed).toBe(false);
  });

  it("does not rewrite onboarding from a single signal", () => {
    const start = completeOnboarding({ density: DENSITY.BALANCED });
    const next = applyPreferenceSignal(start, "enable_focus");
    expect(next.density).toBe(DENSITY.BALANCED);
    expect(next.signalCount).toBe(1);
    expect(next.quietScore).toBeGreaterThan(start.quietScore);
  });

  it("remaps density after repeated Focus use", () => {
    let prefs = completeOnboarding({ density: DENSITY.BALANCED });
    prefs = applyPreferenceSignal(prefs, "enable_focus");
    prefs = applyPreferenceSignal(prefs, "enable_focus");
    prefs = applyPreferenceSignal(prefs, "enable_focus");
    expect(prefs.density).toBe(DENSITY.QUIET);
    expect(prefs.learnedNote).toMatch(/quieter/i);
  });

  it("shortens or lengthens Focus Reset wait from break preference", () => {
    expect(
      wellnessTriggerMsForPrefs({ breaks: BREAKS.OFTEN }),
    ).toBeLessThan(10 * 60 * 1000);
    expect(
      wellnessTriggerMsForPrefs({ breaks: BREAKS.RARELY }),
    ).toBeGreaterThan(10 * 60 * 1000);
    expect(
      wellnessTriggerMsForPrefs({ breaks: BREAKS.WHEN_NEEDED }),
    ).toBe(10 * 60 * 1000);
  });

  it("patches density without wiping the typing baseline", () => {
    const start = completeOnboarding({
      density: DENSITY.QUIET,
      typingBaseline: { backspaceRate: 0.2, eventCount: 20 },
    });
    const next = patchUserPrefs(start, { density: DENSITY.FULL });
    expect(next.density).toBe(DENSITY.FULL);
    expect(next.typingBaseline.backspaceRate).toBe(0.2);
    expect(loadUserPrefs().density).toBe(DENSITY.FULL);
  });

  it("overlays a preferred name onto the demo user", () => {
    const user = overlayDisplayUser(
      { name: "Alex Chen", avatarInitials: "AC", role: "Sales Coordinator" },
      { displayName: "Sam Lee" },
    );
    expect(user.name).toBe("Sam Lee");
    expect(user.avatarInitials).toBe("SL");
    expect(firstNameFromUser(user)).toBe("Sam");
  });
});
