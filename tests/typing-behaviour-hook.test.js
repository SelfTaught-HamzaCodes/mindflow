import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypingBehaviour } from "@/hooks/useTypingBehaviour";

describe("useTypingBehaviour hook", () => {
  it("ignores pure modifier keys", () => {
    const onMetricsChange = vi.fn();
    const { result } = renderHook(() =>
      useTypingBehaviour({ onMetricsChange }),
    );

    act(() => {
      result.current.handleKeyDown({ key: "Shift" });
      result.current.handleKeyDown({ key: "Meta" });
      result.current.handleKeyDown({ key: "Tab" });
    });

    expect(result.current.metrics.eventCount).toBe(0);
    expect(onMetricsChange).not.toHaveBeenCalled();
  });

  it("records characters and backspaces into metrics", () => {
    const { result } = renderHook(() => useTypingBehaviour());

    act(() => {
      result.current.handleKeyDown({ key: "a" });
      result.current.handleKeyDown({ key: "b" });
      result.current.handleKeyDown({ key: "Backspace" });
    });

    expect(result.current.metrics.eventCount).toBe(3);
    expect(result.current.metrics.backspaceRate).toBeCloseTo(1 / 3, 2);
  });

  it("reset clears the sliding window", () => {
    const { result } = renderHook(() => useTypingBehaviour());

    act(() => {
      result.current.handleKeyDown({ key: "x" });
      result.current.reset();
    });

    expect(result.current.metrics).toEqual({
      wpm: 0,
      avgPauseMs: 0,
      backspaceRate: 0,
      consistency: 0.5,
      eventCount: 0,
    });
  });
});
