/**
 * First-visit preferences + light “learn as you go” updates.
 *
 * Onboarding answers seed the workspace. Later actions (Focus, Show all,
 * Focus Reset) nudge scores so density / breaks can drift without a
 * settings page. Nothing medical — just how busy the UI should feel.
 */

export const USER_PREFS_KEY = "mindflow-user-prefs";

export const DENSITY = {
  QUIET: "quiet",
  BALANCED: "balanced",
  FULL: "full",
};

export const INTERRUPTIONS = {
  QUIET: "quiet",
  BALANCED: "balanced",
  INFORMED: "informed",
};

export const BREAKS = {
  OFTEN: "often",
  WHEN_NEEDED: "when-needed",
  RARELY: "rarely",
};

export const PRIMARY_FOCUS = {
  PRIORITIES: "priorities",
  INBOX: "inbox",
  TASKS: "tasks",
  CALENDAR: "calendar",
};

/** Used when PrefsProvider is missing (unit tests) — matches pre-onboarding Calm. */
export const RESEARCH_DEFAULT_PREFS = {
  onboarded: false,
  completedAt: null,
  displayName: "",
  density: DENSITY.FULL,
  interruptions: INTERRUPTIONS.INFORMED,
  breaks: BREAKS.WHEN_NEEDED,
  primaryFocus: PRIMARY_FOCUS.PRIORITIES,
  quietScore: 50,
  breakTolerance: 50,
  signalCount: 0,
  learnedNote: "",
  typingBaseline: null,
};

/** Skip / first-run defaults after sister feedback: quieter, less chrome. */
export const ONBOARDING_DEFAULTS = {
  displayName: "",
  density: DENSITY.QUIET,
  interruptions: INTERRUPTIONS.BALANCED,
  breaks: BREAKS.WHEN_NEEDED,
  primaryFocus: PRIMARY_FOCUS.PRIORITIES,
};

const LEARN_AFTER_SIGNALS = 3;

const SIGNAL_DELTAS = {
  dismiss_reset: { quietScore: 8, breakTolerance: -12 },
  snooze_reset: { quietScore: 4, breakTolerance: -6 },
  accept_reset: { quietScore: 0, breakTolerance: 10 },
  mute_reset: { quietScore: 6, breakTolerance: -25 },
  enable_focus: { quietScore: 10, breakTolerance: 0 },
  exit_focus: { quietScore: -6, breakTolerance: 0 },
  show_hidden_emails: { quietScore: -12, breakTolerance: 0 },
  open_insights: { quietScore: -8, breakTolerance: 0 },
};

const LEARNED_NOTES = {
  quiet: "Workspace is quieter from how you’ve been working.",
  full: "More detail is back — you kept opening hidden or extra surfaces.",
  rarely: "Fewer reset suggestions, based on how you handled the last few.",
  often: "Reset suggestions are a bit more frequent after you used them.",
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function createPrefs(partial = {}) {
  return {
    ...RESEARCH_DEFAULT_PREFS,
    quietScore: 50,
    breakTolerance: 50,
    signalCount: 0,
    learnedNote: "",
    ...partial,
  };
}

export function loadUserPrefs() {
  if (typeof window === "undefined") return createPrefs();
  try {
    const raw = window.localStorage.getItem(USER_PREFS_KEY);
    if (!raw) return createPrefs();
    const parsed = JSON.parse(raw);
    return createPrefs(parsed);
  } catch {
    return createPrefs();
  }
}

export function saveUserPrefs(prefs) {
  if (typeof window === "undefined") return prefs;
  try {
    window.localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // quota / private mode
  }
  return prefs;
}

export function clearUserPrefs() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(USER_PREFS_KEY);
  } catch {
    // ignore
  }
}

export function patchUserPrefs(current, partial) {
  const next = createPrefs({
    ...current,
    ...partial,
    onboarded: true,
    typingBaseline:
      partial.typingBaseline !== undefined
        ? partial.typingBaseline
        : current?.typingBaseline || null,
  });
  if (partial.density) {
    next.quietScore =
      partial.density === DENSITY.QUIET
        ? 70
        : partial.density === DENSITY.FULL
          ? 30
          : 50;
  }
  if (partial.breaks) {
    next.breakTolerance =
      partial.breaks === BREAKS.RARELY
        ? 25
        : partial.breaks === BREAKS.OFTEN
          ? 75
          : 50;
  }
  return saveUserPrefs(next);
}

export function completeOnboarding(answers = {}) {
  const density = answers.density || ONBOARDING_DEFAULTS.density;
  const breaks = answers.breaks || ONBOARDING_DEFAULTS.breaks;
  const prefs = createPrefs({
    onboarded: true,
    completedAt: new Date().toISOString(),
    displayName: String(answers.displayName || "").trim(),
    density,
    interruptions: answers.interruptions || ONBOARDING_DEFAULTS.interruptions,
    breaks,
    primaryFocus: answers.primaryFocus || ONBOARDING_DEFAULTS.primaryFocus,
    quietScore: density === DENSITY.QUIET ? 70 : density === DENSITY.FULL ? 30 : 50,
    breakTolerance:
      breaks === BREAKS.RARELY ? 25 : breaks === BREAKS.OFTEN ? 75 : 50,
    signalCount: 0,
    learnedNote: "",
    typingBaseline: answers.typingBaseline || null,
  });
  return saveUserPrefs(prefs);
}

function densityFromScore(score) {
  if (score >= 65) return DENSITY.QUIET;
  if (score <= 35) return DENSITY.FULL;
  return DENSITY.BALANCED;
}

function breaksFromTolerance(score) {
  if (score <= 25) return BREAKS.RARELY;
  if (score >= 75) return BREAKS.OFTEN;
  return BREAKS.WHEN_NEEDED;
}

/**
 * Nudge scores from a workplace action. Density / breaks only remap after
 * a few signals so one click doesn’t rewrite the onboarding answers.
 */
export function applyPreferenceSignal(prefs, signal) {
  const delta = SIGNAL_DELTAS[signal];
  if (!delta || !prefs?.onboarded) return prefs;

  const next = {
    ...prefs,
    quietScore: clamp(prefs.quietScore + delta.quietScore, 0, 100),
    breakTolerance: clamp(prefs.breakTolerance + delta.breakTolerance, 0, 100),
    signalCount: (prefs.signalCount || 0) + 1,
  };

  if (next.signalCount < LEARN_AFTER_SIGNALS) {
    return saveUserPrefs(next);
  }

  const nextDensity = densityFromScore(next.quietScore);
  const nextBreaks = breaksFromTolerance(next.breakTolerance);
  const notes = [];
  if (nextDensity !== prefs.density) {
    next.density = nextDensity;
    if (LEARNED_NOTES[nextDensity]) notes.push(LEARNED_NOTES[nextDensity]);
  }
  if (nextBreaks !== prefs.breaks) {
    next.breaks = nextBreaks;
    if (LEARNED_NOTES[nextBreaks]) notes.push(LEARNED_NOTES[nextBreaks]);
  }
  if (notes.length) next.learnedNote = notes[0];

  return saveUserPrefs(next);
}

export function wellnessTriggerMsForPrefs(prefs) {
  if (prefs?.breaks === BREAKS.OFTEN) return 5 * 60 * 1000;
  if (prefs?.breaks === BREAKS.RARELY) return 20 * 60 * 1000;
  return 10 * 60 * 1000;
}

/**
 * Layer personal prefs on a workload config.
 * Never re-shows surfaces High / Focus already hid — only tightens further.
 */
export function applyUserPrefs(config, prefs) {
  if (!config) return config;
  const next = {
    showActivityFeed: config.showSecondaryWidgets !== false,
    showResearchPanel: !config.focusMode && config.showAnalytics !== false,
    ...config,
  };

  if (!prefs?.onboarded || next.focusMode) return next;

  if (prefs.density === DENSITY.QUIET) {
    next.showAnalytics = false;
    next.showActivityFeed = false;
    next.showResearchPanel = false;
    next.increaseWhitespace = true;
    if (prefs.primaryFocus !== PRIMARY_FOCUS.CALENDAR) {
      next.showSecondaryWidgets = false;
    }
  } else if (prefs.density === DENSITY.BALANCED) {
    next.showActivityFeed = false;
    next.showResearchPanel = false;
  }

  if (prefs.interruptions === INTERRUPTIONS.QUIET) {
    next.visibleNotificationPriorities = ["priority"];
    next.hideLowNotifications = true;
    next.delayNormalNotifications = true;
  } else if (prefs.interruptions === INTERRUPTIONS.BALANCED) {
    next.hideLowNotifications = true;
    next.visibleNotificationPriorities = (
      next.visibleNotificationPriorities || []
    ).filter((p) => p !== "low");
    if (next.visibleNotificationPriorities.length === 0) {
      next.visibleNotificationPriorities = ["priority"];
    }
  }

  return next;
}

export function overlayDisplayUser(user, prefs) {
  const displayName = String(prefs?.displayName || "").trim();
  if (!user) {
    return {
      name: displayName || "there",
      avatarInitials: initialsFromName(displayName) || "?",
    };
  }
  if (!displayName) return user;
  return {
    ...user,
    name: displayName,
    avatarInitials: initialsFromName(displayName) || user.avatarInitials,
  };
}

export function firstNameFromUser(user) {
  const name = String(user?.name || "").trim();
  if (!name) return "there";
  return name.split(/\s+/)[0];
}
