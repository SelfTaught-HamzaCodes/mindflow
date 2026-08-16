"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { WORKLOAD_LEVELS, WORKLOAD_LABELS } from "@/lib/constants";
import { calculateBehaviourState } from "@/lib/workloadEstimator";
import { getAdaptationConfig } from "@/lib/adaptationRules";
import { applyUserPrefs, wellnessTriggerMsForPrefs } from "@/lib/userPrefs";
import { usePrefs } from "@/context/PrefsContext";
import { saveSessionNote } from "@/lib/supabase";
import {
  clearFocusResetMute,
  isFocusResetMutedToday,
  muteFocusResetToday,
} from "@/lib/wellnessPrefs";
import {
  bumpSessionMetric,
  recordWorkspaceState,
} from "@/lib/researchMetrics";

const WorkloadContext = createContext(null);

/**
 * Graduated response on purpose:
 *   1) Focus Mode kicks in as soon as we hit High
 *   2) Focus Reset only after sustained High (10 demo-min)
 * That gap stops the wellbeing prompt from feeling naggy the second load spikes.
 * Demos speed the clock up becuase nobody wants to wait 10 real minutes in a viva.
 */
export const WELLNESS_TRIGGER_MS = 10 * 60 * 1000;
const WELLNESS_SNOOZE_MS = 15 * 60 * 1000;

/** Demo clock multipliers (wall time × speed = session / wellness time). */
export const DEMO_SPEED_OPTIONS = [1, 30, 60];
export const DEFAULT_DEMO_SPEED = 1;

const emptyMetrics = {
  wpm: 0,
  avgPauseMs: 0,
  backspaceRate: 0,
  consistency: 0.5,
  eventCount: 0,
};

export function WorkloadProvider({ children }) {
  const { prefs, recordSignal } = usePrefs();
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [level, setLevel] = useState(WORKLOAD_LEVELS.NEUTRAL);
  const [score, setScore] = useState(0.5);
  const [confidence, setConfidence] = useState(0);
  const [signals, setSignals] = useState(null);
  const [insufficientData, setInsufficientData] = useState(true);

  /** null = trust the live estimator; otherwise force a level for demos */
  const [forcedLevel, setForcedLevelState] = useState(null);

  /** Speeds up session clock + wellness / delay timers so viva demos arent boring */
  const [demoSpeed, setDemoSpeedState] = useState(DEFAULT_DEMO_SPEED);
  const demoSpeedRef = useRef(DEFAULT_DEMO_SPEED);
  // 0 untill mount — otherwise DemoControls SSR hydrates with a different clock
  const [sessionStartedAt, setSessionStartedAt] = useState(0);
  /** Mirrors highSinceRef for the UI countdown (refs alone dont re-render) */
  const [behaviourHighSince, setBehaviourHighSince] = useState(null);

  const [focusMode, setFocusMode] = useState(false);
  const [wellnessVisible, setWellnessVisible] = useState(false);
  const [wellnessSnoozedUntil, setWellnessSnoozedUntil] = useState(0);
  // false on server + first paint; localStorage only after mount (hydration safety)
  const [focusResetMuted, setFocusResetMuted] = useState(false);
  /**
   * Anchor for delaying Normal notifications under High / Focus.
   * Kept seperate from highSinceRef so a Focus-only demo doesn't also
   * fire the wellness prompt — examiners got confused by that once.
   */
  const [notificationDelayStartedAt, setNotificationDelayStartedAt] =
    useState(null);

  const highSinceRef = useRef(null);
  const levelRef = useRef(level);
  const forcedLevelRef = useRef(forcedLevel);
  // only auto-enter Focus once per High spell — toggling off shouldn't immediately bounce back
  const autoFocusAppliedRef = useRef(false);
  const focusModeRef = useRef(focusMode);
  const typingBaselineRef = useRef(prefs.typingBaseline);

  useEffect(() => {
    focusModeRef.current = focusMode;
  }, [focusMode]);

  useEffect(() => {
    typingBaselineRef.current = prefs.typingBaseline;
  }, [prefs.typingBaseline]);

  useEffect(() => {
    setFocusResetMuted(isFocusResetMutedToday());
    setSessionStartedAt(Date.now());
  }, []);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    forcedLevelRef.current = forcedLevel;
  }, [forcedLevel]);

  useEffect(() => {
    demoSpeedRef.current = demoSpeed;
  }, [demoSpeed]);

  const setDemoSpeed = useCallback((next) => {
    const speed = DEMO_SPEED_OPTIONS.includes(next) ? next : DEFAULT_DEMO_SPEED;
    demoSpeedRef.current = speed;
    setDemoSpeedState(speed);
  }, []);

  const effectiveLevel = forcedLevel || level;

  /** Wall ms → demo-accelerated ms. */
  const toDemoMs = useCallback(
    (wallMs) => wallMs * demoSpeedRef.current,
    [],
  );

  // Debounce timeline writes — rapid Focus ↔ Elevated flips were spamming Insights
  useEffect(() => {
    let label;
    let kind = "level";
    if (effectiveLevel === WORKLOAD_LEVELS.HIGH) {
      label = focusMode ? "High · Focus Mode" : "High";
      kind = focusMode ? "focus" : "level";
    } else if (focusMode) {
      label = "Focus Mode";
      kind = "focus";
    } else {
      label = WORKLOAD_LABELS[effectiveLevel] || "Calm";
    }

    const id = window.setTimeout(() => {
      recordWorkspaceState(label, kind);
    }, 700);
    return () => window.clearTimeout(id);
  }, [effectiveLevel, focusMode]);

  /**
   * Side-effects for level changes (auto Focus, delay anchors, etc).
   * Event-driven on purpose — putting this in a render effect caused wierd
   * double-fires when forcedLevel + live estimate updated in the same tick.
   */
  const applyLevelSideEffects = useCallback((nextEffective) => {
    if (nextEffective === WORKLOAD_LEVELS.HIGH) {
      if (highSinceRef.current == null) {
        const started = Date.now();
        highSinceRef.current = started;
        setBehaviourHighSince(started);
      }
      // only set once so the delay window doesn't keep resetting
      setNotificationDelayStartedAt((prev) => prev ?? Date.now());
      if (!autoFocusAppliedRef.current) {
        autoFocusAppliedRef.current = true;
        setFocusMode((prev) => {
          if (!prev) bumpSessionMetric("focusActivations");
          return true;
        });
      }
      return;
    }

    highSinceRef.current = null;
    setBehaviourHighSince(null);
    autoFocusAppliedRef.current = false;
    setWellnessVisible(false);

    // Keep delaying normals if user is still in Focus even after leaving High
    if (!focusModeRef.current) {
      setNotificationDelayStartedAt(null);
    }

    // Calm = full restore — Focus Mode is a High-load response, not a calm one
    if (nextEffective === WORKLOAD_LEVELS.CALM) {
      setFocusMode(false);
      setNotificationDelayStartedAt(null);
    }
  }, []);

  const updateFromMetrics = useCallback(
    (nextMetrics) => {
      setMetrics(nextMetrics);
      const result = calculateBehaviourState(
        nextMetrics,
        levelRef.current,
        typingBaselineRef.current,
      );
      setLevel(result.level);
      setScore(result.score);
      setConfidence(result.confidence);
      setSignals(result.signals);
      setInsufficientData(Boolean(result.insufficientData));

      const nextEffective = forcedLevelRef.current || result.level;
      applyLevelSideEffects(nextEffective);
    },
    [applyLevelSideEffects],
  );

  const setForcedLevel = useCallback(
    (nextForced) => {
      setForcedLevelState(nextForced);
      forcedLevelRef.current = nextForced;
      const nextEffective = nextForced || levelRef.current;
      applyLevelSideEffects(nextEffective);
    },
    [applyLevelSideEffects],
  );

  // Poll sustained High — faster tick when demo speed is up so we dont miss the trigger
  useEffect(() => {
    const id = setInterval(() => {
      if (highSinceRef.current == null) return;
      if (Date.now() < wellnessSnoozedUntil) return;
      if (isFocusResetMutedToday()) return;
      const demoElapsed =
        (Date.now() - highSinceRef.current) * demoSpeedRef.current;
      const triggerMs = wellnessTriggerMsForPrefs(prefs);
      if (demoElapsed >= triggerMs) {
        setWellnessVisible(true);
      }
    }, demoSpeed > 1 ? 400 : 2000);
    return () => clearInterval(id);
  }, [wellnessSnoozedUntil, demoSpeed, prefs]);

  const adaptation = useMemo(
    () =>
      applyUserPrefs(
        getAdaptationConfig(effectiveLevel, { focusMode }),
        prefs,
      ),
    [effectiveLevel, focusMode, prefs],
  );

  const dismissWellness = useCallback(
    async ({ muteToday = false, acceptedReset = false } = {}) => {
      setWellnessVisible(false);
      const restarted = Date.now();
      highSinceRef.current = restarted; // reset sustained timer
      setBehaviourHighSince(restarted);
      if (muteToday) {
        muteFocusResetToday();
        setFocusResetMuted(true);
        recordSignal("mute_reset");
      }
      recordSignal(acceptedReset ? "accept_reset" : "dismiss_reset");
      bumpSessionMetric(
        acceptedReset
          ? "breakSuggestionsAccepted"
          : "breakSuggestionsDismissed",
      );
      await saveSessionNote({
        userId: "demo-alex",
        noteType: acceptedReset ? "wellness_accepted" : "wellness_dismiss",
        payload: {
          level: effectiveLevel,
          muteToday,
          at: new Date().toISOString(),
        },
      });
    },
    [effectiveLevel, recordSignal],
  );

  const snoozeWellness = useCallback(
    async ({ muteToday = false } = {}) => {
      setWellnessVisible(false);
      if (muteToday) {
        muteFocusResetToday();
        setFocusResetMuted(true);
        recordSignal("mute_reset");
      }
      recordSignal("snooze_reset");
      bumpSessionMetric("breakSuggestionsDismissed");
      // Wall-clock snooze shortened by demo speed
      const wallSnooze = Math.max(1000, WELLNESS_SNOOZE_MS / demoSpeedRef.current);
      setWellnessSnoozedUntil(Date.now() + wallSnooze);
      await saveSessionNote({
        userId: "demo-alex",
        noteType: "wellness_snooze",
        payload: {
          level: effectiveLevel,
          snoozeMs: WELLNESS_SNOOZE_MS,
          demoSpeed: demoSpeedRef.current,
          muteToday,
          at: new Date().toISOString(),
        },
      });
    },
    [effectiveLevel, recordSignal],
  );

  /** Examiner shortcut — skip the 10-min wait so we can show Focus Reset on demand */
  const previewWellness = useCallback(() => {
    clearFocusResetMute();
    setFocusResetMuted(false);
    setWellnessSnoozedUntil(0);
    setWellnessVisible(true);
  }, []);

  const clearWellnessMute = useCallback(() => {
    clearFocusResetMute();
    setFocusResetMuted(false);
    setWellnessSnoozedUntil(0);
  }, []);

  const toggleFocusMode = useCallback(() => {
    const next = !focusModeRef.current;
    focusModeRef.current = next;
    setFocusMode(next);
    // Keep preference signals out of the setState updater — React 19 treats
    // updater fns as part of render, so setPrefs here would warn.
    if (next) {
      bumpSessionMetric("focusActivations");
      recordSignal("enable_focus");
      setNotificationDelayStartedAt((anchor) => anchor ?? Date.now());
    } else {
      recordSignal("exit_focus");
      if (
        (forcedLevelRef.current || levelRef.current) !== WORKLOAD_LEVELS.HIGH
      ) {
        setNotificationDelayStartedAt(null);
      }
    }
  }, [recordSignal]);

  const setFocusModeSafe = useCallback((nextValue) => {
    setFocusMode((prev) => {
      const next =
        typeof nextValue === "function" ? nextValue(prev) : nextValue;
      if (next && !prev) bumpSessionMetric("focusActivations");
      focusModeRef.current = next;
      if (next) {
        setNotificationDelayStartedAt((anchor) => anchor ?? Date.now());
      } else if (
        (forcedLevelRef.current || levelRef.current) !== WORKLOAD_LEVELS.HIGH
      ) {
        setNotificationDelayStartedAt(null);
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      metrics,
      level: effectiveLevel,
      liveLevel: level,
      forcedLevel,
      setForcedLevel,
      score,
      confidence,
      signals,
      insufficientData,
      updateFromMetrics,
      adaptation,
      focusMode,
      setFocusMode: setFocusModeSafe,
      toggleFocusMode,
      wellnessVisible,
      dismissWellness,
      snoozeWellness,
      previewWellness,
      clearWellnessMute,
      wellnessTriggerMs: wellnessTriggerMsForPrefs(prefs),
      highLoadStartedAt: notificationDelayStartedAt,
      behaviourHighSince,
      isDemoOverride: forcedLevel != null,
      demoSpeed,
      setDemoSpeed,
      sessionStartedAt,
      toDemoMs,
      focusResetMuted,
    }),
    [
      metrics,
      effectiveLevel,
      level,
      forcedLevel,
      setForcedLevel,
      score,
      confidence,
      signals,
      insufficientData,
      updateFromMetrics,
      adaptation,
      focusMode,
      setFocusModeSafe,
      toggleFocusMode,
      wellnessVisible,
      dismissWellness,
      snoozeWellness,
      previewWellness,
      clearWellnessMute,
      notificationDelayStartedAt,
      behaviourHighSince,
      demoSpeed,
      setDemoSpeed,
      sessionStartedAt,
      toDemoMs,
      focusResetMuted,
      prefs,
    ],
  );

  return (
    <WorkloadContext.Provider value={value}>
      {children}
    </WorkloadContext.Provider>
  );
}

export function useWorkload() {
  const ctx = useContext(WorkloadContext);
  if (!ctx) {
    throw new Error("useWorkload must be used within WorkloadProvider");
  }
  return ctx;
}
