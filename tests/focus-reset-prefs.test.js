import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isFocusResetMutedToday,
  muteFocusResetToday,
  clearFocusResetMute,
} from "@/lib/wellnessPrefs";

/** Mirror of WorkloadContext WELLNESS_TRIGGER_MS (avoids importing JSX module here). */
const WELLNESS_TRIGGER_MS = 10 * 60 * 1000;

describe("Focus Reset preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("is not muted by default", () => {
    expect(isFocusResetMutedToday()).toBe(false);
  });

  it("muteFocusResetToday persists a same-day mute flag", () => {
    muteFocusResetToday();
    expect(isFocusResetMutedToday()).toBe(true);
  });

  it("clearFocusResetMute removes the mute flag", () => {
    muteFocusResetToday();
    clearFocusResetMute();
    expect(isFocusResetMutedToday()).toBe(false);
  });

  it("treats a mute stored for a different day as not muted today", () => {
    window.localStorage.setItem("mindflow-focus-reset-mute-date", "2000-01-01");
    expect(isFocusResetMutedToday()).toBe(false);
  });

  it("documents the sustained High trigger duration (10 minutes)", () => {
    expect(WELLNESS_TRIGGER_MS).toBe(10 * 60 * 1000);
  });

  it("returns false when localStorage throws (private mode resilience)", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    expect(isFocusResetMutedToday()).toBe(false);
    spy.mockRestore();
  });
});
