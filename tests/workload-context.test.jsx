import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkloadProvider, useWorkload, WELLNESS_TRIGGER_MS } from "@/context/WorkloadContext";
import { WORKLOAD_LEVELS } from "@/lib/constants";
import { clearFocusResetMute } from "@/lib/wellnessPrefs";

vi.mock("@/lib/supabase", () => ({
  saveSessionNote: vi.fn(async () => ({ ok: false, reason: "mocked" })),
  persistTaskUpdate: vi.fn(async () => ({ ok: false })),
  isSupabaseConfigured: false,
  supabase: null,
}));

function Probe({ onReady }) {
  const ctx = useWorkload();
  onReady?.(ctx);
  return (
    <div>
      <span data-testid="level">{ctx.level}</span>
      <span data-testid="focus">{String(ctx.focusMode)}</span>
      <span data-testid="wellness">{String(ctx.wellnessVisible)}</span>
      <span data-testid="muted">{String(ctx.focusResetMuted)}</span>
      <span data-testid="score">{ctx.score}</span>
      <span data-testid="analytics">
        {String(ctx.adaptation.showAnalytics)}
      </span>
      <button type="button" onClick={() => ctx.setForcedLevel(WORKLOAD_LEVELS.HIGH)}>
        Force High
      </button>
      <button type="button" onClick={() => ctx.setForcedLevel(WORKLOAD_LEVELS.CALM)}>
        Force Calm
      </button>
      <button type="button" onClick={() => ctx.setForcedLevel(WORKLOAD_LEVELS.NEUTRAL)}>
        Force Elevated
      </button>
      <button type="button" onClick={() => ctx.toggleFocusMode()}>
        Toggle Focus
      </button>
      <button type="button" onClick={() => ctx.setFocusMode(false)}>
        Exit Focus
      </button>
      <button
        type="button"
        onClick={() =>
          ctx.updateFromMetrics({
            wpm: 18,
            avgPauseMs: 900,
            backspaceRate: 0.28,
            consistency: 0.2,
            eventCount: 40,
          })
        }
      >
        Push High Metrics
      </button>
      <button type="button" onClick={() => ctx.previewWellness()}>
        Preview Wellness
      </button>
      <button type="button" onClick={() => ctx.snoozeWellness()}>
        Snooze
      </button>
      <button
        type="button"
        onClick={() => ctx.dismissWellness({ muteToday: true })}
      >
        Mute Today
      </button>
      <button
        type="button"
        onClick={() => ctx.dismissWellness({ acceptedReset: false })}
      >
        Continue Working
      </button>
      <button type="button" onClick={() => ctx.clearWellnessMute()}>
        Clear Mute
      </button>
    </div>
  );
}

function renderWorkload() {
  return render(
    <WorkloadProvider>
      <Probe />
    </WorkloadProvider>,
  );
}

describe("WorkloadContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearFocusResetMute();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when useWorkload is used outside the provider", () => {
    expect(() => render(<Probe />)).toThrow(
      /useWorkload must be used within WorkloadProvider/,
    );
  });

  it("starts at Elevated (neutral) with insufficient data until metrics arrive", () => {
    renderWorkload();
    expect(screen.getByTestId("level").textContent).toBe(WORKLOAD_LEVELS.NEUTRAL);
    expect(screen.getByTestId("focus").textContent).toBe("false");
  });

  it("auto-activates Focus Mode when forced to High", async () => {
    const user = userEvent.setup();
    renderWorkload();
    await user.click(screen.getByRole("button", { name: "Force High" }));
    expect(screen.getByTestId("level").textContent).toBe(WORKLOAD_LEVELS.HIGH);
    expect(screen.getByTestId("focus").textContent).toBe("true");
    expect(screen.getByTestId("analytics").textContent).toBe("false");
  });

  it("exits Focus Mode when forced back to Calm", async () => {
    const user = userEvent.setup();
    renderWorkload();
    await user.click(screen.getByRole("button", { name: "Force High" }));
    await user.click(screen.getByRole("button", { name: "Force Calm" }));
    expect(screen.getByTestId("level").textContent).toBe(WORKLOAD_LEVELS.CALM);
    expect(screen.getByTestId("focus").textContent).toBe("false");
    expect(screen.getByTestId("analytics").textContent).toBe("true");
  });

  it("allows manual Focus Mode toggle while Elevated", async () => {
    const user = userEvent.setup();
    renderWorkload();
    await user.click(screen.getByRole("button", { name: "Force Elevated" }));
    await user.click(screen.getByRole("button", { name: "Toggle Focus" }));
    expect(screen.getByTestId("focus").textContent).toBe("true");
    await user.click(screen.getByRole("button", { name: "Exit Focus" }));
    expect(screen.getByTestId("focus").textContent).toBe("false");
  });

  it("updates live estimate from high-load typing metrics", async () => {
    const user = userEvent.setup();
    renderWorkload();
    await user.click(screen.getByRole("button", { name: "Push High Metrics" }));
    expect(screen.getByTestId("level").textContent).toBe(WORKLOAD_LEVELS.HIGH);
    expect(screen.getByTestId("focus").textContent).toBe("true");
    expect(Number(screen.getByTestId("score").textContent)).toBeGreaterThanOrEqual(
      0.65,
    );
  });

  it("shows Focus Reset via previewWellness (examiner bypass)", async () => {
    const user = userEvent.setup();
    renderWorkload();
    await user.click(screen.getByRole("button", { name: "Preview Wellness" }));
    expect(screen.getByTestId("wellness").textContent).toBe("true");
  });

  it("Continue Working dismisses Focus Reset", async () => {
    const user = userEvent.setup();
    renderWorkload();
    await user.click(screen.getByRole("button", { name: "Preview Wellness" }));
    await user.click(screen.getByRole("button", { name: "Continue Working" }));
    expect(screen.getByTestId("wellness").textContent).toBe("false");
  });

  it("snooze hides Focus Reset without leaving it visible", async () => {
    const user = userEvent.setup();
    renderWorkload();
    await user.click(screen.getByRole("button", { name: "Preview Wellness" }));
    await user.click(screen.getByRole("button", { name: "Snooze" }));
    expect(screen.getByTestId("wellness").textContent).toBe("false");
  });

  it("mute today sets focusResetMuted", async () => {
    const user = userEvent.setup();
    renderWorkload();
    await user.click(screen.getByRole("button", { name: "Preview Wellness" }));
    await user.click(screen.getByRole("button", { name: "Mute Today" }));
    expect(screen.getByTestId("wellness").textContent).toBe("false");
    expect(screen.getByTestId("muted").textContent).toBe("true");
  });

  it("activates Focus Reset after sustained High under demo-accelerated clock", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <WorkloadProvider>
        <Probe />
      </WorkloadProvider>,
    );

    await act(async () => {
      screen.getByRole("button", { name: "Force High" }).click();
    });

    // Provider uses demoSpeed=1 by default → need full WELLNESS_TRIGGER_MS.
    // Speed up by setting demo speed via context is harder with fake timers;
    // instead advance wall clock past 10 minutes.
    expect(screen.getByTestId("wellness").textContent).toBe("false");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(WELLNESS_TRIGGER_MS + 3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("wellness").textContent).toBe("true");
    });
  });
});
