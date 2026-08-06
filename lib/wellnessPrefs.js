/**
 * Local prefs for Focus Reset prompts.
 * Mute is per calendar day — enough agency without needing a settings page.
 * Kept out of medical framing on purpose.
 */

const MUTE_KEY = "mindflow-focus-reset-mute-date";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function isFocusResetMutedToday() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === todayKey();
  } catch {
    return false;
  }
}

export function muteFocusResetToday() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, todayKey());
  } catch {
    // ignore quota / private mode
  }
}

export function clearFocusResetMute() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MUTE_KEY);
  } catch {
    // ignore
  }
}
