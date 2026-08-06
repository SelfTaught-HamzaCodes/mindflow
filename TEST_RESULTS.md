# Mindflow Prototype — Evaluation Test Results

**Project:** Designing an Emotion-Aware Adaptive Email and Task Manager to Reduce Workplace Stress  
**Prototype:** Mindflow (Interaction Design research prototype)  
**Document purpose:** Automated functional evaluation evidence for the Final Year Project dissertation (Evaluation chapter)  
**Test date:** 6 August 2026  
**Test runner:** Vitest 4.1.10 (jsdom)  
**Command:** `npm test`  
**Result:** **107 passed / 0 failed** (10 test files)

---

## 1. Evaluation scope and method

Prior to this evaluation, the repository contained **no automated test suite**. A Vitest-based suite was therefore introduced to exercise the prototype’s rule-based behaviour pipeline, adaptation rules, notification policy, Focus Reset preferences, React context providers, utility helpers, and App Router page registration.

### 1.1 What these tests do claim

- Deterministic verification of pure functions and context-driven state transitions.
- Confirmation that documented thresholds, classification bands, hysteresis, and adaptation matrices behave as implemented in `lib/` and `context/`.
- Honest recording of a defect discovered during test authoring (see §6).

### 1.2 What these tests do **not** claim

- They are **not** a clinical or psychometric validation of “stress”.
- They do **not** replace a user study, heuristic evaluation, or viva walkthrough.
- They do **not** include full browser end-to-end (E2E) visual regression; routing checks are structural (page modules + sidebar hrefs), not live HTTP navigation.
- Typing behaviour is validated via extracted pure metrics (`lib/typingMetrics.js`) and the `useTypingBehaviour` hook under jsdom—not longitudinal field capture from real workers.

> Scope reminder: Mindflow estimates **behavioural / cognitive workload** from typing interaction patterns. It does **not** diagnose medical stress.

---

## 2. Test environment

| Item | Detail |
|------|--------|
| Framework | Vitest + React Testing Library + jsdom |
| Application stack under test | Next.js App Router, React 19, Context API |
| Primary modules | `lib/workloadEstimator.js`, `lib/typingMetrics.js`, `lib/adaptationRules.js`, `lib/notificationFilter.js`, `lib/wellnessPrefs.js`, `lib/adaptationSummary.js`, contexts, utilities |
| External services | Supabase persistence mocked (prototype remains evaluable offline) |
| Seed data | Sample JSON datasets (`data/*.json`) aligned to the calendar via `alignSampleDates` |

---

## 3. Detailed results by feature area

Convention for each row:

- **Expected** — behaviour required by the research prototype design  
- **Actual** — observed outcome under automated test  
- **Result** — Pass / Fail  

### 3.1 Behaviour estimation

| Feature tested | Expected behaviour | Actual result | Result | Notes |
|----------------|-------------------|---------------|--------|-------|
| Typing speed (WPM) | Characters in the sliding window convert to words/minute using 5 chars/word | 25 chars over 28.8s → **10.4 WPM**; empty window → 0; burst typing capped by ≥1s span | **Pass** | Implemented in `computeTypingMetrics` |
| Pause duration | Mean of non-null inter-key intervals | Pauses 200/300/400 → avg **300 ms**; single keystroke → 0 | **Pass** | First keystroke correctly has `pauseMs: null` |
| Correction frequency | Backspaces ÷ total key events | 2 backspaces / 5 events → **0.4** | **Pass** | Includes Delete as correction in the hook |
| Typing consistency | Low interval SD → high consistency (0–1) | Regular intervals >0.9; irregular <0.5; <3 intervals → 0.5 | **Pass** | `1 − SD/250`, clamped |
| Sliding window | Events older than 45s excluded | Stale events dropped from `eventCount` | **Pass** | `TYPING_WINDOW_MS = 45000` |
| Workload score | Weighted composite in [0, 1]; higher under high-load proxies | Calm < Elevated < High; longer pauses / more corrections raise score | **Pass** | Weights: WPM 0.25, pause 0.30, backspace 0.25, consistency 0.20 |
| Calm classification | Score < 0.35 → `calm` / label “Calm” | Representative calm profile classified Calm | **Pass** | Non-medical UI labels verified |
| Elevated classification | 0.35 ≤ score < 0.65 → `neutral` / “Elevated” | Mid profile classified Elevated | **Pass** | Internal key remains `neutral` |
| High classification | Score ≥ 0.65 → `high` / “High” | High-load profile classified High | **Pass** | |
| Insufficient data | <12 events → do not trust estimate; retain prior / default Elevated | `eventCount: 5` keeps prior Calm; empty defaults to Elevated; `insufficientData: true` | **Pass** | `minEvents = 12` |
| Hysteresis | Borderline band crossings do not flicker level | Score 0.66 from Neutral stays Neutral; clear 0.85 → High | **Pass** | Margin 0.15 |
| Hook: modifiers ignored | Shift/Meta/Tab do not create events | `eventCount` remains 0 | **Pass** | `useTypingBehaviour` |
| Hook: record + reset | Chars/backspaces update metrics; reset clears window | 3 events, backspaceRate ≈ 1/3; reset → empty metrics | **Pass** | |

### 3.2 Interface adaptation

| Feature tested | Expected behaviour | Actual result | Result | Notes |
|----------------|-------------------|---------------|--------|-------|
| Calm layout | Full dashboard: analytics, secondary widgets, all priorities | `showAnalytics/Secondary/LowPriority* = true`; no whitespace boost | **Pass** | `getAdaptationConfig(calm)` |
| Elevated layout | Surfaces retained; priorities emphasised; low notifications hidden | Highlights + badges on; `hideLowNotifications: true`; not focus-eligible | **Pass** | Progressive emphasis |
| High layout | Declutter secondary surfaces; delay normal notifications; focus-eligible | Analytics/secondary/low items off; sidebar collapse; `focusModeEligible: true` | **Pass** | |
| High task/email filter | Low-priority tasks/emails removed | Low items filtered out | **Pass** | `filterTasks` / `filterEmails` |
| Focus Mode activation | Further reduce to today ∩ important; Focus flags set | Tasks: today∧important∧¬done; emails: today∧important; `focusTodayImportantOnly` | **Pass** | Also works if Focus forced from Calm/Elevated |
| Focus Mode exit | Base level config restored when `focusMode: false` | Calm config without Focus-only flags; analytics restored | **Pass** | Context also clears Focus on forced Calm |
| Explainability panels | Prose reasons from metrics; High warm-up fallback when no signals | High metrics yield typing/pause/correction/rhythm prose; fallback returns 4 reasons when signals empty | **Pass** | See §6 for defect fixed during evaluation |

### 3.3 Notification filtering

| Feature tested | Expected behaviour | Actual result | Result | Notes |
|----------------|-------------------|---------------|--------|-------|
| Priority normalisation | Legacy `urgent`/`high` → `priority`; `medium` → `normal` | Mapping confirmed; unknown → normal | **Pass** | Safety for sample data |
| Calm — show all | Priority, normal, and low visible | 4/4 visible; policy “Show all” | **Pass** | |
| Elevated — hide low | Low hidden; priority + normal immediate | Low in `hidden` with `hidden_low` | **Pass** | |
| Priority under High | Priority remains visible | Priority + legacy urgent stay in `visible` | **Pass** | |
| Delayed normal | Normal held for 45s under High | `delayed` with `delayed_normal` before release | **Pass** | `NORMAL_DELAY_MS = 45000` |
| Delay release | After delay, normal becomes visible (`wasDelayed`) | Released at `started + 45000` | **Pass** | |
| Demo speed | `demoSpeed` shortens effective delay | Delay ÷ 30 when `demoSpeed: 30` | **Pass** | Viva support |
| Hidden low (High / Focus) | Low hidden under High and under Focus even if Calm | Confirmed | **Pass** | Focus sets `highLoad` policy |
| Countdown (`remainingMs`) | Delayed items expose time remaining for UI | `remainingMs = delay − elapsed`; clamped ≥ 0 | **Pass** | Supports notification countdown UI |
| Sort order | Unread → priority rank → newest | Expected order verified | **Pass** | |

### 3.4 Focus Reset

| Feature tested | Expected behaviour | Actual result | Result | Notes |
|----------------|-------------------|---------------|--------|-------|
| Sustained High trigger | Visible after 10 minutes of sustained High (wall clock × demo speed) | With fake timers, wellness becomes visible after `WELLNESS_TRIGGER_MS + poll` | **Pass** | `WorkloadContext` interval |
| Examiner preview | `previewWellness` bypasses the 10-minute wait | `wellnessVisible = true` | **Pass** | Intended for viva demos |
| Continue working | Dismiss hides prompt | `wellnessVisible = false` after dismiss | **Pass** | Maps to “Continue Working” |
| Snooze | Hide prompt and defer re-show | Visible cleared after snooze | **Pass** | Wall snooze shortened by demo speed |
| Mute today | Persist same-day mute in `localStorage` | Mute flag set; `focusResetMuted = true` | **Pass** | Key: `mindflow-focus-reset-mute-date` |
| Mute expiry | Mute from another calendar day is ignored | Old date → not muted | **Pass** | |
| Private-mode resilience | Storage errors do not crash; treat as unmuted | `getItem` throw → `false` | **Pass** | |
| Trigger constant | Documented 10-minute duration | `10 * 60 * 1000` ms | **Pass** | |

### 3.5 Context providers

| Feature tested | Expected behaviour | Actual result | Result | Notes |
|----------------|-------------------|---------------|--------|-------|
| `useWorkload` guard | Throws outside provider | Error thrown | **Pass** | |
| Initial workload state | Elevated until enough typing data | Level `neutral`, Focus off | **Pass** | |
| Auto Focus on High | Entering High auto-enables Focus Mode | Forced High → Focus true; analytics hidden | **Pass** | Graduated response |
| Exit Focus on Calm | Calm clears Focus | Focus false; analytics true | **Pass** | |
| Manual Focus toggle | Toggle while Elevated | On then off | **Pass** | |
| Live metrics → High | High typing metrics update level + Focus | Score ≥ 0.65; Focus on | **Pass** | |
| `useAppData` guard | Throws outside provider | Error thrown | **Pass** | |
| Sample data load | Emails, tasks, notifications, demo user present | Counts > 0; user name matches Alex | **Pass** | Dates aligned to “today” |
| Select / mark email read | Selection updates; unread decrements | Confirmed | **Pass** | |
| Toggle task status | Open ↔ done; open count updates | Confirmed | **Pass** | Supabase persist mocked |
| Notification read helpers | Single + mark-all | Unread → 0 after mark-all | **Pass** | |
| Demo injectors | Add email, task, N notifications | Counts increase by 1 / 1 / 3 | **Pass** | Prototype-only |

### 3.6 Utility modules

| Feature tested | Expected behaviour | Actual result | Result | Notes |
|----------------|-------------------|---------------|--------|-------|
| `formatDuration` / `formatTime` / relative day / priority label | Stable display helpers | m:ss, h:mm:ss, Today/Yesterday, capitalised labels | **Pass** | |
| `alignSampleDates` | Scenario day shifts to real today | `2026-03-18` → `2026-08-06` under fixed “now” | **Pass** | Keeps demos calendar-realistic |
| Email / task priority reasons | Rule-based explainability (not AI) | Reason ids present; suggested focus tasks ranked | **Pass** | |
| Research metrics | Session counters + adaptation aggregates | Bumps persist; timeline dedupes; `buildResearchMetrics` returns actions | **Pass** | sessionStorage |

### 3.7 Routing

| Feature tested | Expected behaviour | Actual result | Result | Notes |
|----------------|-------------------|---------------|--------|-------|
| App Router pages | `/`, `/inbox`, `/tasks`, `/compose`, `/analytics`, `/reflection` exist with default export | All six page modules present | **Pass** | Structural check |
| Root layout | Layout exports default and accepts `children` | Confirmed | **Pass** | |
| Sidebar hrefs | Nav targets match implemented routes | All route strings present in `Sidebar.js` | **Pass** | Not a live browser navigation test |

---

## 4. Summary table (dissertation-ready)

| Area | Tests (approx.) | Passed | Failed | Evidence strength |
|------|-----------------|--------|--------|-------------------|
| Behaviour estimation (metrics, score, Calm/Elevated/High, hysteresis, hook) | 31 | 31 | 0 | Strong (unit) |
| Interface adaptation (layouts, Focus, explainability) | 16 | 16 | 0 | Strong (unit) |
| Notification filtering (priority / delay / hide / countdown) | 13 | 13 | 0 | Strong (unit) |
| Focus Reset (trigger, snooze, mute, continue) | 16 | 16 | 0 | Strong (unit + context) |
| Context providers (`AppDataContext`, `WorkloadContext`) | 16 | 16 | 0 | Strong (integration) |
| Utility modules | 13 | 13 | 0 | Strong (unit) |
| Routing (App Router registration) | 8 | 8 | 0 | Moderate (structural) |
| **Overall** | **107** | **107** | **0** | Automated functional baseline |

*Counts are grouped for narrative clarity; the authoritative total is Vitest’s **107 passed**.*

---

## 5. Reproduction

```bash
npm install
npm test
```

Optional verbose listing:

```bash
npm test -- --reporter=verbose
```

Test sources live under `tests/`. Configuration: `vitest.config.mjs`. Pure typing helpers used by both the hook and tests: `lib/typingMetrics.js`.

---

## 6. Bugs discovered during evaluation

### 6.1 Unreachable High explainability fallback (fixed)

**Location:** `lib/adaptationSummary.js` → `getBehaviourReasons`  

**Observation:** Under Workspace Status **High**, the intended warm-up fallback (four default directional reasons when no signals fire) was **unreachable**. Any consistency value either satisfied the “rhythm down” branch (`consistency < 0.55`) or the “rhythm up” branch (`consistency >= 0.55`), so `reasons.length === 0` never occurred while `level === high`.

**Impact:** Forced-High demos with calm/default metrics could show only a single “Typing rhythm” reason instead of the fuller explainability story designed for the Focus Reset / Why panels.

**Remediation applied:** Calm-direction consistency reasons are no longer emitted when the current level is High. The High fallback is reachable again and is covered by automated tests.

**Status:** Fixed prior to the final green test run; final suite reports **0 failures**.

---

## 7. Limitations

1. **Typing-only sensing.** Workload is inferred solely from keystroke dynamics. Mouse inactivity, calendar load, email volume, and physiological signals are out of scope.
2. **Heuristic thresholds.** Cut-points (e.g. WPM 45/28, pause 350/700 ms, score bands 0.35/0.65) are research heuristics, not population-calibrated norms.
3. **Sample / demo data.** Emails, tasks, and notifications are authored JSON, not live mailbox APIs.
4. **No E2E visual suite.** Layout decluttering is asserted via adaptation flags and filters, not pixel-level screenshots in CI.
5. **Routing tests are structural.** They confirm page modules and sidebar targets; they do not drive Next.js HTTP routing in a browser.
6. **Focus Reset timing in demos.** Production trigger is 10 minutes of sustained High; viva demos rely on `demoSpeed` and/or `previewWellness`.
7. **Optional Supabase.** Persistence is best-effort; tests mock it. Core adaptive behaviour does not require a backend.
8. **jsdom fidelity.** Framer Motion animations and some browser APIs are not fully reproduced; behaviour logic is still verifiable.

---

## 8. Edge cases exercised

| Edge case | Observed handling |
|-----------|-------------------|
| Fewer than 12 key events | Estimate marked `insufficientData`; prior/default level retained |
| Empty typing window | Zero WPM/pause/backspace; consistency 0.5 |
| Burst typing (sub-second span) | Span floored at 1s to avoid extreme WPM |
| Borderline workload scores | Hysteresis retains previous level |
| Legacy notification priorities (`urgent`, `high`, `medium`) | Normalised to priority/normal |
| Focus Mode while Calm/Elevated | Notification policy treats Focus as high-load filtering |
| Mute date ≠ today | Treated as not muted |
| `localStorage` / `sessionStorage` failures | Fail closed to safe defaults |
| Hook modifier keys | Ignored (no false events) |
| Mark-all notifications | Unread count → 0 |

---

## 9. Future improvements

1. **Browser E2E** (Playwright/Cypress): Calm → Elevated → High → Focus → Focus Reset visual journeys with screenshots for the dissertation appendix.
2. **Threshold calibration study:** Collect typing samples from office workers to refine estimator bands.
3. **Accessibility evaluation:** Keyboard paths and screen-reader labels for Focus Reset and notification countdown.
4. **Property-based tests** for `computeLoadScore` monotonicity across signal axes.
5. **Contract tests** between `ADAPTATION_BY_LEVEL` and UI components (assert widgets mount/unmount).
6. **Telemetry ethics review** if any real keystroke logging is introduced beyond the in-memory sliding window.
7. **Comparative baseline:** Non-adaptive control UI for a controlled within-subjects evaluation of overload reduction.

---

## 10. Conclusion

The Mindflow prototype’s core adaptive pipeline—typing metrics → workload score → Calm/Elevated/High classification with hysteresis → interface adaptation, notification policy, Focus Mode, and Focus Reset—behaves consistently with its documented design under automated evaluation. **107 / 107** automated tests passed after remediation of one explainability-fallback defect found during test construction.

These results provide a **transparent functional baseline** suitable for the Evaluation chapter. They should be complemented by qualitative methods (expert review, walkthrough, or user study) when arguing claims about reduced cognitive overload in realistic work settings.

---

## Appendix A — Test file map

| File | Concern |
|------|---------|
| `tests/behaviour-estimation.test.js` | Typing metrics |
| `tests/workload-estimator.test.js` | Score, classification, hysteresis |
| `tests/typing-behaviour-hook.test.js` | `useTypingBehaviour` |
| `tests/adaptation.test.js` | Layouts, Focus, explainability |
| `tests/notification-filter.test.js` | Priority / delay / hide / countdown |
| `tests/focus-reset-prefs.test.js` | Mute preferences + trigger constant |
| `tests/workload-context.test.jsx` | WorkloadProvider integration |
| `tests/app-data-context.test.jsx` | AppDataProvider integration |
| `tests/utilities.test.js` | Format, align, reasons, research metrics |
| `tests/routing.test.js` | App Router pages + sidebar |

## Appendix B — Machine summary (final run)

```
Test Files  10 passed (10)
     Tests  107 passed (107)
```

## Appendix C — Code coverage (V8 / Vitest)

**Date:** 6 August 2026  
**Command:** `npm run test:coverage`  
**Provider:** `@vitest/coverage-v8`  
**Instrument scope:** `lib/**`, `hooks/**`, `context/**` (behaviour, adaptation, and state modules under automated evaluation)  
**Explicitly excluded from this report:** `lib/supabase.js` (mocked in tests; optional backend), `lib/logoFont.js` (presentation-only), UI `components/**` and `app/**` pages (not unit-tested; visual evidence is via walkthrough/screenshots)

### Table C.1 — Overall coverage summary

| Metric | Covered | Total | Coverage (%) |
|--------|--------:|------:|-------------:|
| **Statements** | 655 | 722 | **90.72** |
| **Branches** | 413 | 588 | **70.23** |
| **Functions** | 146 | 157 | **92.99** |
| **Lines** | 602 | 635 | **94.80** |

### Table C.2 — Coverage by module (dissertation detail)

| Module | Statements (%) | Branches (%) | Functions (%) | Lines (%) |
|--------|---------------:|-------------:|--------------:|----------:|
| `context/AppDataContext.js` | 100.00 | 70.83 | 100.00 | 100.00 |
| `context/WorkloadContext.js` | 90.05 | 63.29 | 87.50 | 92.54 |
| `hooks/useTypingBehaviour.js` | 92.10 | 88.00 | 87.50 | 97.14 |
| `lib/adaptationRules.js` | 100.00 | 88.88 | 100.00 | 100.00 |
| `lib/adaptationSummary.js` | 96.15 | 86.48 | 80.00 | 96.07 |
| `lib/alignSampleDates.js` | 75.75 | 50.00 | 75.00 | 91.66 |
| `lib/constants.js` | 100.00 | 100.00* | 100.00* | 100.00 |
| `lib/emailPriorityReasons.js` | 90.00 | 53.84 | 100.00 | 100.00 |
| `lib/format.js` | 80.64 | 68.75 | 100.00 | 87.50 |
| `lib/notificationFilter.js` | 100.00 | 88.00 | 100.00 | 100.00 |
| `lib/researchMetrics.js` | 83.00 | 56.00 | 100.00 | 89.65 |
| `lib/taskPriorityReasons.js` | 82.05 | 59.18 | 100.00 | 93.54 |
| `lib/typingMetrics.js` | 100.00 | 81.25 | 100.00 | 100.00 |
| `lib/wellnessPrefs.js` | 73.33 | 50.00 | 100.00 | 91.66 |
| `lib/workloadEstimator.js` | 97.36 | 86.66 | 85.71 | 97.05 |
| **All instrumented files** | **90.72** | **70.23** | **92.99** | **94.80** |

\*No executable branches/functions in this constants module (V8 reports 100% with 0/0).

### Coverage interpretation (for Chapter 5 discussion)

- **Line (94.80%) and statement (90.72%) coverage** indicate that nearly all executable paths in the evaluated core modules are exercised by the 107-test suite.
- **Function coverage (92.99%)** is similarly strong for public helpers and context APIs.
- **Branch coverage (70.23%)** is the weakest metric, reflecting untested defensive/guard branches (e.g. storage failure paths beyond the one exercised case, optional calendar/activity aligners, and alternate demo/analytics narrative branches in `researchMetrics.js`). This is an honest limitation: high line coverage does not imply exhaustive conditional coverage.
- HTML report (local): `coverage/index.html` after `npm run test:coverage`.
