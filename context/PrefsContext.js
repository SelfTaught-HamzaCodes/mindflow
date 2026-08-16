"use client";

/**
 * First-visit prefs + optional replay.
 * Hydration-safe: localStorage is read after mount so SSR doesn’t flash
 * the onboarding sheet for people who already finished it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAppData } from "@/context/AppDataContext";
import {
  applyPreferenceSignal,
  clearUserPrefs,
  completeOnboarding,
  createPrefs,
  firstNameFromUser,
  loadUserPrefs,
  overlayDisplayUser,
  patchUserPrefs,
} from "@/lib/userPrefs";

const PrefsContext = createContext(null);

const fallbackApi = {
  ready: true,
  prefs: createPrefs(),
  displayUser: null,
  firstName: "there",
  complete: () => createPrefs({ onboarded: true }),
  update: () => {},
  recordSignal: () => {},
  resetOnboarding: () => {},
};

export function PrefsProvider({ children }) {
  const { user } = useAppData();
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState(() => createPrefs());

  useEffect(() => {
    setPrefs(loadUserPrefs());
    setReady(true);
  }, []);

  const complete = useCallback((answers) => {
    const next = completeOnboarding(answers);
    setPrefs(next);
    return next;
  }, []);

  const update = useCallback((partial) => {
    setPrefs((prev) => patchUserPrefs(prev, partial));
  }, []);

  const recordSignal = useCallback((signal) => {
    setPrefs((prev) => applyPreferenceSignal(prev, signal));
  }, []);

  const resetOnboarding = useCallback(() => {
    clearUserPrefs();
    setPrefs(createPrefs());
  }, []);

  const displayUser = useMemo(
    () => overlayDisplayUser(user, prefs),
    [user, prefs],
  );

  const value = useMemo(
    () => ({
      ready,
      prefs,
      displayUser,
      firstName: firstNameFromUser(displayUser),
      complete,
      update,
      recordSignal,
      resetOnboarding,
    }),
    [ready, prefs, displayUser, complete, update, recordSignal, resetOnboarding],
  );

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) return fallbackApi;
  return ctx;
}
