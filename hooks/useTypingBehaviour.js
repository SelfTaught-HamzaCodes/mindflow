"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TYPING_WINDOW_MS,
  computeTypingMetrics,
} from "@/lib/typingMetrics";

/**
 * Captures typing behaviour for the workload estimator.
 *
 * Why these metrics? Cheap in a browser, no special hardware, and they map
 * reasonably onto cognitive-load proxies from the HCI lit (speed, pauses,
 * corrections, rhythm). Sliding window so an early burst of typos doesnt
 * poison the whole session.
 *
 * Heavy lifting lives in lib/typingMetrics so the hook stays thin.
 */

export function useTypingBehaviour({ onMetricsChange } = {}) {
  const eventsRef = useRef([]);
  const lastKeyTimeRef = useRef(null);
  const [metrics, setMetrics] = useState({
    wpm: 0,
    avgPauseMs: 0,
    backspaceRate: 0,
    consistency: 0.5,
    eventCount: 0,
  });

  const recompute = useCallback(() => {
    const now = Date.now();
    const windowed = eventsRef.current.filter(
      (e) => now - e.t <= TYPING_WINDOW_MS,
    );
    eventsRef.current = windowed;
    const next = computeTypingMetrics(windowed, now, TYPING_WINDOW_MS);
    setMetrics(next);
    onMetricsChange?.(next);
    return next;
  }, [onMetricsChange]);

  const handleKeyDown = useCallback(
    (event) => {
      // modifiers alone arent typing behaviour — skip them
      if (
        event.key === "Shift" ||
        event.key === "Control" ||
        event.key === "Alt" ||
        event.key === "Meta" ||
        event.key === "CapsLock" ||
        event.key === "Tab"
      ) {
        return;
      }

      const now = Date.now();
      const pauseMs =
        lastKeyTimeRef.current != null ? now - lastKeyTimeRef.current : null;
      lastKeyTimeRef.current = now;

      const isBackspace = event.key === "Backspace" || event.key === "Delete";
      const isChar =
        !isBackspace &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey;

      if (!isBackspace && !isChar) return;

      eventsRef.current.push({
        t: now,
        type: isBackspace ? "backspace" : "char",
        pauseMs,
      });

      recompute();
    },
    [recompute],
  );

  const reset = useCallback(() => {
    eventsRef.current = [];
    lastKeyTimeRef.current = null;
    const empty = {
      wpm: 0,
      avgPauseMs: 0,
      backspaceRate: 0,
      consistency: 0.5,
      eventCount: 0,
    };
    setMetrics(empty);
    onMetricsChange?.(empty);
  }, [onMetricsChange]);

  // Tick so idle time decays the window — otherwise High sticks forever after you stop
  useEffect(() => {
    const id = setInterval(() => {
      if (eventsRef.current.length) recompute();
    }, 5000);
    return () => clearInterval(id);
  }, [recompute]);

  return {
    metrics,
    handleKeyDown,
    reset,
    windowMs: TYPING_WINDOW_MS,
  };
}
