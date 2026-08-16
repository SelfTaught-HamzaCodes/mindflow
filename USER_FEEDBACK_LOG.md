# User Feedback Log

Changes recorded from the first informal usability pass onward. Each entry starts from what a tester said, then what we changed. Keep appending here rather than mixing these notes into the older `IMPLEMENTATION_LOG.md` milestones.

---

## 2026-08-16 — Sister pilot (personalisation, clutter, first visit)

### Feedback
- The app can be useful, but it needs more personalisation.
- Ask a few questions first so the interface is trained to the person’s preferences, then keep learning on the way.
- Too much going on — reduce UI clutter.
- Add a small onboarding when someone visits for the first time.

### Changes made
- First-visit onboarding (skip allowed): preferred name, workspace density, primary focus, interruptions, and reset timing.
- Answers persist in `localStorage` and reshape the Calm/Elevated workspace (quiet hides analytics, activity, and extra chrome; calendar can stay if that was the chosen focus).
- Light learning from later actions (Focus on/off, Show all in Inbox, Insights visits, Focus Reset accept/dismiss/mute). Density and reset timing only remap after a few signals so one click does not overwrite onboarding.
- Quieter default chrome: compact Workspace Status (expand for meters), slimmer Research row, no duplicate status badge, shorter sidebar footer, Activity feed off unless density is Full.
- Preferences can be reopened from the avatar or sidebar; Demo includes “Replay onboarding”.

### Files
- Added: `lib/userPrefs.js`, `context/PrefsContext.js`, `components/onboarding/OnboardingFlow.js`, `USER_FEEDBACK_LOG.md`
- Tests: `tests/user-prefs.test.js`, `tests/onboarding.test.jsx`
- Updated: providers, workload adaptation, dashboard, status widget, shell, inbox, Insights, reflection, wellness greeting, demo controls

### Notes for later feedback
- Onboarding is local-only (no account). Replay from Demo if a later tester should see the first-visit flow again.

---

## 2026-08-16 — Sister pilot (typing sample / natural mistakes)

### Feedback
- Ask the user to type a few words during setup.
- Some people naturally type with a lot of mistakes and are not necessarily Elevated or High.
- The algorithm should account for that — reduce the weight of corrections for those typists.

### Changes made
- Optional onboarding typing sample (16+ keystrokes). Words are not stored; only rhythm / correction metrics are.
- If the sample already has a high backspace rate, correction weight is lowered and personal “calm / high” correction thresholds are raised so their usual typos do not look like load.
- Naturally slower typists get a similar shift on WPM thresholds.
- Live estimator, Why? copy, and Research Panel use the personalised weights when a sample exists. Skip still uses the original research defaults.
- Clear High profiles (slow + long pauses + irregular rhythm) can still reach High.

### Files
- Added: `lib/typingBaseline.js`, `components/onboarding/TypingCalibrateStep.js`, `tests/typing-baseline.test.js`
- Updated: `lib/workloadEstimator.js`, `lib/userPrefs.js`, `lib/adaptationSummary.js`, onboarding flow, WorkloadContext, Compose / status / Focus Why / Research Panel

---

## 2026-08-16 — Sister pilot (Focus Reset + High warning)

### Feedback
- Focus Reset needs a simpler UI.
- The warning that appears when going from Elevated to High should stay until the user closes it themselves.

### Changes made
- Focus Reset is a small card: one sentence, optional breathing after Start, Continue / Later, and mute-for-today. Stretch cards, Why panel, and the long disclaimer are gone.
- Focus Mode activation overlay no longer auto-hides after 2.8s. It stays until Got it or the close control.

---

## 2026-08-16 — Sister pilot (hide Interface Simplifications list)

### Feedback
- The Interface Simplifications checklist (distractions removed, hidden panels, delayed notifications, collapsed nav) should not sit on the page, because that information is already in the popup.

### Changes made
- Removed the Interface Simplifications block from Focus Mode and the matching High-load summary strip on the standard dashboard. The activation popup still lists what changed.

---

## 2026-08-16 — Sister pilot (Demo controls, no sample injectors)

### Feedback
- The Demo block on the left is useful and empowering.
- There is no need for the Simulate sample data buttons.

### Changes made
- Left Demo in the sidebar (clock, speed, workload override, Focus Reset preview, replay onboarding).
- Removed +Urgent, +Task, and +5 Notifs.

---

## 2026-08-16 — Sister pilot (preferences dropdown, not full onboarding)

### Feedback
- Do not send people through the whole onboarding again to change preferences.
- Add a small menu / dropdown on the profile icon.
- Show which estimator rules were set from the initial typing sample.

### Changes made
- Profile icon opens a compact preferences dropdown (density, front-and-centre, interruptions, reset timing). Changes apply immediately.
- The dropdown lists the typing-sample rules (correction weight, calm/high correction thresholds, usual WPM). If they skipped the sample, it says default research rules are in use.
- First-visit onboarding is unchanged. Demo still has Replay onboarding.

---

## 2026-08-16 — Sister pilot (Focus Reset is breathing only)

### Feedback
- Too many things in Focus Reset are distracting. Reduce it down to just breathing.

### Changes made
- Focus Reset is title, breathing guide, and Done. Greeting, stretch copy, Start / Continue / Later, and mute-for-today are gone.

---

## 2026-08-16 — Sister pilot (task Why + glitchy animation)

### Feedback
- Why? under every task is too much. Reduce it.
- The task list animation is glitchy.

### Changes made
- Removed the Why? expander from each task. Priority is still visible via badges (high, Important, Due Today).
- Completing a task now fades out without layout / height / popLayout motion, which was causing the jump.

---

## 2026-08-16 — Sister pilot (specific typing sentence)

### Feedback
- It is hard to think of something random to type. Give a specific sentence.

### Changes made
- Onboarding now asks people to copy: “The morning notes are on my desk. I will send them after the meeting.”
- Progress is “keep going until the sentence is done” instead of a keystroke count.

