# Mindflow Implementation Log

Technical development record for the Interaction Design Final Year Project. Entries are appended per milestone and written for inclusion in Chapter 4 (Implementation).

Post-pilot UI changes from tester comments are recorded in `USER_FEEDBACK_LOG.md`.

---

## Milestone 1 - Foundation & Design System

### Date
2026-08-01

### Objective
Replace the Next.js starter template with a navigable Mindflow application shell, design tokens, reusable UI primitives, and sample workplace data.

### Features Implemented
- Enterprise light theme (soft surfaces, blue accent, rounded corners, soft shadows)
- App shell with responsive sidebar and top bar
- Routes: Dashboard, Inbox, Tasks, Compose
- Sample JSON datasets for emails, tasks, notifications, and demo user
- `AppDataContext` for shared local data operations
- Reusable UI primitives (`Button`, `Card`, `Badge`, `EmptyState`)

### Files Created
- `data/emails.json`, `data/tasks.json`, `data/notifications.json`, `data/user.json`
- `context/AppDataContext.js`
- `components/layout/AppShell.js`, `Sidebar.js`, `TopBar.js`
- `components/ui/*`
- `components/providers/AppProviders.js`
- `app/inbox/page.js`, `app/tasks/page.js`, `app/compose/page.js`
- `lib/constants.js`, `lib/format.js`
- `IMPLEMENTATION_LOG.md`

### Files Modified
- `app/layout.js`, `app/page.js`, `app/globals.css`
- `package.json` (dependencies)

### Key Algorithms or Logic Added
- Local state helpers for mark-read, task toggle, and notification read status
- Navigation badge counts derived from sample data

### Technologies or Libraries Used
- Next.js App Router, React 19, Tailwind CSS v4, Lucide React, Framer Motion

### Design Decisions and Rationale
- Fake demo user (no auth) to prioritise UX evaluation over account infrastructure
- JSON sample data to satisfy research ethics/constraints (no real mailbox APIs)
- Context over Redux for a small prototype surface area

### Challenges Encountered
- Aligning Tailwind v4 CSS-variable theming with a Linear/Notion-like enterprise look while avoiding common AI-default purple themes

### Bugs Fixed
- N/A (initial foundation)

### Known Limitations
- No persistence across refresh for interaction state
- Compose send action intentionally disabled

### Potential Improvements
- Persist UI preferences (sidebar collapsed, last selected email) in `localStorage`

### Relation to Dissertation
Establishes the evaluation environment and information architecture required before adaptive behaviour can be studied. Supports Chapter 4 sections on system architecture, technology choices, and baseline interface design.

---

## Milestone 2 - Behaviour Analysis Engine

### Date
2026-08-02

### Objective
Capture typing behaviour metrics and estimate Calm / Neutral / High Cognitive Load without medical claims.

### Features Implemented
- `useTypingBehaviour` sliding-window metrics (WPM, pause, backspace rate, consistency)
- Explainable heuristic estimator with documented thresholds and hysteresis
- `WorkloadContext` exposing live estimate, score, confidence, and signals
- Top-bar `WorkloadBadge` labelled **Estimated Workload**
- Demo override control for examiner walkthroughs
- Compose page as primary typing instrument

### Files Created
- `hooks/useTypingBehaviour.js`
- `lib/workloadEstimator.js`
- `context/WorkloadContext.js`
- `components/adaptive/WorkloadBadge.js`
- `components/adaptive/DemoWorkloadToggle.js`

### Files Modified
- `app/compose/page.js`
- `components/layout/TopBar.js`

### Key Algorithms or Logic Added
- Sliding 45s event window
- Weighted load score from WPM, pause, backspace, and consistency signals
- Hysteresis to reduce level flicker
- Confidence gated by minimum event count

### Technologies or Libraries Used
- React hooks / Context

### Design Decisions and Rationale
- Heuristic estimator preferred over opaque ML for dissertation transparency
- Explicit non-medical labelling in all user-facing copy
- Demo override included so participants/examiners can compare adaptive states reliably

### Challenges Encountered
- Balancing sensitivity (useful adaptation) against stability (avoid flicker)

### Bugs Fixed
- N/A at introduction

### Known Limitations
- Typing-only behaviour model; does not incorporate mouse/idle/multitasking signals
- Thresholds are research defaults, not clinically validated

### Potential Improvements
- Calibrate thresholds with pilot study data; add idle-time decay of confidence

### Relation to Dissertation
Implements the independent variable (behaviour estimate) for the research question. Supports Chapter 4 discussion of sensing, scoring, and ethical wording.

---

## Milestone 3 - Adaptive Dashboard & Notification Filtering

### Date
2026-08-03

### Objective
Map Estimated Workload to concrete interface adaptations that reduce clutter under high load.

### Features Implemented
- `adaptationRules` configuration per workload level
- Dashboard hides analytics and secondary widgets under High Cognitive Load
- Low-priority tasks/emails filtered; priorities highlighted
- Increased whitespace under high load
- Notification panel filters by allowed priorities
- Framer Motion enter/exit transitions for adaptive regions

### Files Created
- `lib/adaptationRules.js`
- `lib/notificationFilter.js`
- `components/dashboard/*`
- `components/notifications/NotificationPanel.js`
- `components/email/*`, `components/tasks/*`

### Files Modified
- `app/page.js` (via `DashboardView`)
- `app/inbox/page.js`, `app/tasks/page.js`
- `components/layout/AppShell.js`, `TopBar.js`

### Key Algorithms or Logic Added
- Level → UI config mapping
- Priority-aware list filtering for emails/tasks/notifications

### Technologies or Libraries Used
- Framer Motion (`AnimatePresence`)

### Design Decisions and Rationale
- Calm preserves full dashboard (control condition)
- High load removes secondary information rather than merely restyling it
- Notification filtering keeps urgent/high items visible for workplace plausibility

### Challenges Encountered
- Ensuring empty states remain understandable when filters remove most items

### Bugs Fixed
- Clarified empty-state copy to explain adaptation/focus filtering

### Known Limitations
- Adaptation is discrete (3 levels), not continuous density scaling
- Analytics values are descriptive counts only (sample data)

### Potential Improvements
- Add user override to pin a widget even under high load

### Relation to Dissertation
Directly operationalises the dependent UI adaptations in the research question. Supports Chapter 4 adaptive interaction design and evaluation stimuli.

---

## Milestone 4 - Priority Focus Mode & Wellness Prompt

### Date
2026-08-04

### Objective
Complete the core adaptive loop with Priority Focus Mode and a sustained-load wellness prompt.

### Features Implemented
- Priority Focus Mode: today's important emails/tasks only
- Auto-enable focus once when entering High Cognitive Load (user can exit)
- Focus banner with accessible dismiss control
- Wellness modal after ~45s sustained high load
- Animated breathing guide plus dismiss / snooze actions
- Non-medical wording throughout

### Files Created
- `components/adaptive/FocusBanner.js`
- `components/adaptive/WellnessPrompt.js`

### Files Modified
- `context/WorkloadContext.js`
- `components/layout/AppShell.js`, `TopBar.js`
- `lib/adaptationRules.js` (focus overrides)

### Key Algorithms or Logic Added
- Sustained high-load timer for wellness eligibility
- Snooze window to prevent prompt fatigue
- Focus-mode filter: `today && important`

### Technologies or Libraries Used
- Framer Motion dialog transitions

### Design Decisions and Rationale
- Auto-suggest focus under high load mirrors the research hypothesis that the system should intervene
- User remains in control (exit focus, dismiss/snooze wellness)
- Wellness framed as behavioural reset, not clinical advice

### Challenges Encountered
- Preventing focus mode from re-forcing itself after user dismissal while still high

### Bugs Fixed
- Replaced `prev || true` auto-focus logic with a one-shot transition ref

### Known Limitations
- Wellness timing is fixed (not personalised)
- Breathing animation is illustrative, not a validated intervention protocol

### Potential Improvements
- Participant-configurable wellness delay; log acceptance rates for evaluation

### Relation to Dissertation
Completes the adaptive intervention set required to answer whether behavioural data can reduce perceived overload. Supports Chapter 4 intervention design and Chapter 5 evaluation measures (focus usage, wellness acceptance).

---

## Milestone 5 - Polish, Accessibility & Dissertation Support

### Date
2026-08-05

### Objective
Make the prototype evaluation-ready with accessibility, responsive behaviour, and examiner-facing research instrumentation.

### Features Implemented
- Keyboard-accessible controls, ARIA labels/roles on key interactive regions
- `prefers-reduced-motion` CSS guard
- Focus-visible rings on interactive components
- Empty states for filtered lists
- Collapsible Research Panel (metrics, signals, thresholds)
- Examiner-oriented README rewrite

### Files Created
- `components/adaptive/ResearchPanel.js`

### Files Modified
- `app/globals.css`
- `README.md`
- Multiple interactive components for a11y attributes

### Key Algorithms or Logic Added
- None (presentation / instrumentation)

### Technologies or Libraries Used
- Existing stack; semantic HTML / ARIA

### Design Decisions and Rationale
- Research Panel kept collapsible so it does not contaminate the primary adaptive UX during participant tasks, yet remains available for viva demos

### Challenges Encountered
- Balancing research transparency UI against ecological validity of the workplace shell

### Bugs Fixed
- N/A

### Known Limitations
- No automated accessibility test suite yet
- Screen-reader coverage not formally audited

### Potential Improvements
- Add Playwright smoke tests for Calm vs High adaptation states

### Relation to Dissertation
Supports reproducible demonstration and evaluation logistics. Strengthens Chapter 4 credibility and Chapter 5 study procedure materials.

---

## Milestone 6 - Optional Supabase Persistence

### Date
2026-08-06

### Objective
Provide optional persistence for task updates and wellness session notes without making Supabase mandatory for evaluation.

### Features Implemented
- Supabase client wrapper with graceful no-op when env vars are absent
- `persistTaskUpdate` and `saveSessionNote` helpers
- SQL schema + RLS starter policies for research demo
- `.env.example` documentation

### Files Created
- `lib/supabase.js`
- `supabase/schema.sql`
- `.env.example`

### Files Modified
- `context/AppDataContext.js` (best-effort task persist)
- `context/WorkloadContext.js` (wellness dismiss/snooze notes)
- `package.json` (`@supabase/supabase-js`)

### Key Algorithms or Logic Added
- Configuration gate: local JSON remains source of truth unless Supabase is configured

### Technologies or Libraries Used
- `@supabase/supabase-js`

### Design Decisions and Rationale
- Optional persistence avoids blocking UX evaluation on cloud setup
- Demo RLS policies intentionally permissive for a research prototype (documented as non-production)

### Challenges Encountered
- Keeping local-first behaviour identical when remote calls fail

### Bugs Fixed
- N/A

### Known Limitations
- No auth; demo user id hardcoded (`demo-alex`)
- Remote task list is not hydrated on load (local JSON remains canonical unless extended later)

### Potential Improvements
- Hydrate tasks from Supabase when configured; add authenticated participant IDs for study logging

### Relation to Dissertation
Shows a realistic path from prototype to instrumented evaluation logging without compromising the offline/demo research setup. Supports Chapter 4 infrastructure and optional Chapter 5 data-collection appendix.

---

## Milestone 2 Completion Pass - Fake Productivity System UI

### Date
2026-08-07

### Objective
Complete the presentation-layer productivity system so the prototype contains a credible workplace surface: Inbox, email preview, tasks, calendar, notifications, and activity feed, all backed by realistic fake business data and no new backend services.

### Features Implemented
- Dedicated `CalendarWidget` with timed events, locations, attendees, and priority/type badges
- Dedicated `ActivityFeed` with actor, action, target, detail, and typed workplace events
- Local JSON datasets for calendar events and activity items
- Secondary dashboard region now composes Calendar + Activity (still hidden under High Cognitive Load)
- Existing Inbox, Email Preview, Task List, and Notification Panel retained as the core productivity chrome

### Files Created
- `data/calendar.json`
- `data/activity.json`
- `components/dashboard/CalendarWidget.js`
- `components/dashboard/ActivityFeed.js`

### Files Modified
- `components/dashboard/SecondaryWidgets.js` (replaced hardcoded lists with dedicated widgets)
- `IMPLEMENTATION_LOG.md`

### Key Algorithms or Logic Added
- Presentation-only sorting: calendar by start time; activity by newest `createdAt`
- Optional `todayOnly` / `limit` props for widget density control (no persistence or API calls)

### Technologies or Libraries Used
- Existing stack (React, Lucide, shared UI primitives); local JSON imports

### Design Decisions and Rationale
- Calendar and Activity are first-class components (not inline JSX) so Chapter 4 can describe them as reusable UI modules
- Data remains static JSON to preserve the research constraint: no Gmail/Outlook/Google APIs
- Widgets stay inside the secondary region so adaptive decluttering (High Cognitive Load) can still remove them without changing primary priority workflows
- Visual language matches the enterprise shell: soft surfaces, badges, timeline/avatar cues, generous spacing

### Challenges Encountered
- Earlier “Team pulse” / “Today’s schedule” stubs were insufficient for dissertation screenshots and component-level explanation

### Bugs Fixed
- Removed hardcoded secondary widget content that could drift from sample datasets

### Known Limitations
- Calendar is an agenda list, not a full month grid
- Activity feed is not interactive (no “mark seen” / deep links)
- No backend sync; refresh restores JSON defaults

### Potential Improvements
- Month/week calendar view for richer ecological validity
- Cross-link activity items to related email/task IDs
- Participant-configurable seed datasets per evaluation scenario

### Relation to Dissertation
Completes the baseline productivity ecology against which adaptive interventions are judged. Supports Chapter 4 interface inventory (Inbox, preview, tasks, calendar, notifications, activity) and strengthens ecological validity for Chapter 5 usability evaluation.

---

## Milestone 3 Alignment Pass - Behaviour Analysis API & Status Widget

### Date
2026-08-08

### Objective
Align the behaviour analysis module with the dissertation milestone brief: expose `calculateBehaviourState()`, keep a fully rule-based (non-AI) estimator, and present a dedicated Behaviour Status widget on the dashboard.

### Features Implemented
- Canonical `calculateBehaviourState(metrics, previousLevel)` API returning `state` / `label` / `score` / `confidence` / `signals`
- `estimateWorkload` retained as a thin alias for compatibility
- `WorkloadContext` now calls `calculateBehaviourState`
- Dashboard `BehaviourStatusWidget` showing live Estimated Workload, load score, confidence, and the four typing metrics with animated meters
- Explicit non-medical copy (“Behaviour Status”, “Estimated Workload”)

### Files Created
- `components/adaptive/BehaviourStatusWidget.js`

### Files Modified
- `lib/workloadEstimator.js`
- `context/WorkloadContext.js`
- `components/dashboard/DashboardView.js`
- `IMPLEMENTATION_LOG.md`

### Key Algorithms or Logic Added
- No new scoring math; naming and presentation aligned to milestone language
- Widget visualises the same four inputs: WPM, average pause, backspace frequency, consistency

### Technologies or Libraries Used
- Framer Motion (subtle meter / pulse animation); existing Context + Lucide

### Design Decisions and Rationale
- Function renamed/aliased to `calculateBehaviourState` so Chapter 4 can cite the milestone API literally
- Widget remains visible even under High Cognitive Load because it is the research instrument readout, not secondary clutter
- Rule-based thresholds unchanged to preserve explainability for examiners

### Challenges Encountered
- Balancing a rich status visualisation without implying clinical diagnosis

### Bugs Fixed
- N/A

### Known Limitations
- Thresholds remain pilot defaults, not empirically calibrated
- Live estimate still requires typing in Compose (or demo override)

### Potential Improvements
- Inline mini typing pad on the widget for faster demos
- Export CSV of metric windows for evaluation logging

### Relation to Dissertation
Makes the sensing → state calculation → presentation pipeline explicit for Chapter 4 (Behaviour Analysis). Supports transparent discussion of rule-based thresholds versus opaque AI classifiers.

---

## Milestone 5 Alignment Pass - Notification Filtering (Priority / Normal / Low)

### Date
2026-08-09

### Objective
Implement notification adaptation that matches the research brief: under High Cognitive Load, keep Priority visible, delay Normal, and hide Low.

### Features Implemented
- Notification priority model remapped to `priority` | `normal` | `low`
- `classifyNotifications()` with explicit visible / delayed / hidden buckets
- Normal-priority delay window (`NORMAL_DELAY_MS = 45s`) anchored to high-load start time
- Notification panel UI shows active items plus a Delayed section with countdown
- Neutral workload hides Low immediately (no delay); Calm shows all
- Legacy priority strings (`urgent` / `high` / `medium`) still normalised safely

### Files Created
- N/A (extended existing modules)

### Files Modified
- `data/notifications.json`
- `lib/notificationFilter.js`
- `lib/adaptationRules.js`
- `context/WorkloadContext.js` (`highLoadStartedAt`)
- `components/notifications/NotificationPanel.js`
- `IMPLEMENTATION_LOG.md`

### Key Algorithms or Logic Added
- High / Focus: Priority → visible; Normal → hold until `highLoadStartedAt + 45s`; Low → hidden
- When delay elapses, Normal items move into the visible list (`wasDelayed` flag)
- Leaving High clears the delay anchor so Normal items are not artificially held

### Technologies or Libraries Used
- Existing React state + interval tick for countdown; Framer Motion panel transitions

### Design Decisions and Rationale
- Delay (not permanent hide) for Normal preserves eventual awareness while reducing immediate overload
- Low is fully suppressed under load because it contributes little decision value
- Countdown UI makes the adaptation explainable during evaluation / viva demos

### Challenges Encountered
- Needed a stable high-load timestamp in React state (not only a ref) so delayed items re-render when released

### Bugs Fixed
- Previous filter hid medium/high without a delay mechanism, which did not match the milestone brief

### Known Limitations
- Delay duration is fixed (45s), not personalised
- Delayed items are not persisted across refresh
- Focus Mode reuses the high-load notification policy

### Potential Improvements
- Participant-configurable delay; “release all delayed now” examiner control; analytics of delayed→opened rates

### Relation to Dissertation
Operationalises adaptive interruption management for Chapter 4 and provides a clear independent/dependent variable pair for Chapter 5 (workload state → notification visibility/timing).

---

## Milestone 6 Alignment Pass - Priority Focus Mode Workspace

### Date
2026-08-11

### Objective
Implement Focus Mode as a dedicated reduced workspace that shows only Priority Inbox, Today's Tasks, and a Break Reminder, with animated transitions and all other dashboard surfaces hidden.

### Features Implemented
- `FocusModeView` dashboard composition (3 surfaces only)
- `PriorityInbox` - today's important emails
- `TodaysTasks` - today's important open tasks
- `BreakReminder` - persistent behavioural break guidance + optional breathing guide
- `AnimatePresence` swap between standard dashboard and Focus workspace
- Staggered enter animation for the three Focus panels
- Focus banner suppressed on `/` to avoid duplicating FocusModeView chrome; retained on Inbox/Tasks routes

### Files Created
- `components/focus/FocusModeView.js`
- `components/focus/PriorityInbox.js`
- `components/focus/TodaysTasks.js`
- `components/focus/BreakReminder.js`

### Files Modified
- `components/dashboard/DashboardView.js`
- `components/adaptive/FocusBanner.js`
- `IMPLEMENTATION_LOG.md`

### Key Algorithms or Logic Added
- Focus Mode still uses `filterEmails` / `filterTasks` with `focusTodayImportantOnly`
- Layout-level gating: when `focusMode === true`, render Focus composition instead of Behaviour Status, analytics, secondary widgets, full task overview, and Research Panel

### Technologies or Libraries Used
- Framer Motion (`mode="wait"`, staggered variants)

### Design Decisions and Rationale
- Focus Mode is a workspace replacement, not merely a filter on the dense dashboard - stronger ecological test of decluttering
- Break Reminder is always present in Focus (unlike the delayed wellness modal) so the intervention is visible during evaluation
- Breathing guide remains optional and non-medical in wording

### Challenges Encountered
- Avoiding duplicate Focus messaging between AppShell banner and FocusModeView header

### Bugs Fixed
- Focus Mode previously left Behaviour Status and Research Panel visible, violating “everything else hidden”

### Known Limitations
- Shell chrome (sidebar/top bar) remains for navigation affordance
- Inbox/Tasks routes still use filtered lists rather than the 3-panel Focus composition

### Potential Improvements
- Full-screen Focus route (`/focus`) without sidebar for stronger immersion during lab studies

### Relation to Dissertation
Completes the Priority Focus Mode intervention described in the research design. Supports Chapter 4 adaptive interaction implementation and Chapter 5 comparison of full dashboard vs Focus workspace under high estimated load.

---

## Milestone 7 - Wellness Intervention

### Date
2026-08-13

### Objective
Present a non-medical wellness intervention when Estimated Workload remains high, offering a break prompt, stretch cues, breathing animation, and dismiss/snooze controls.

### Features Implemented
- Trigger after sustained High Cognitive Load (~45 seconds)
- Modal intervention titled **Take a break**
- Stretch suggestions (shoulders, eye distance, stand/reach)
- Animated breathing guide (inhale / hold / exhale)
- Dismiss and Remind-me-later actions
- Copy framed as Behaviour Estimate / workspace suggestion only - no medical diagnosis language

### Files Created
- N/A (rewrote existing wellness UI)

### Files Modified
- `components/adaptive/WellnessPrompt.js`
- `IMPLEMENTATION_LOG.md`

### Key Algorithms or Logic Added
- Existing sustained-high timer in `WorkloadContext` (`WELLNESS_TRIGGER_MS = 45000`)
- Snooze window (`WELLNESS_SNOOZE_MS = 5 minutes`) prevents immediate re-prompt
- Breathing phase cycle driven by interval (2s steps)

### Technologies or Libraries Used
- Framer Motion for modal and breathing scale animation

### Design Decisions and Rationale
- Soft sky/emerald visual language (calm workspace cue) rather than clinical red/alert styling
- Stretch tips are practical desk micro-breaks, not physiotherapy prescriptions
- Explicit disclaimer that the prompt is behavioural, not medical
- Dismiss remains one-click so users stay in control (important for ethical HCI prototypes)

### Challenges Encountered
- Balancing visibility of the intervention against feeling intrusive during evaluation demos

### Bugs Fixed
- Stretch guidance was previously missing from the wellness dialog relative to the milestone brief

### Known Limitations
- Fixed trigger timing; not personalised
- Breathing animation is illustrative, not a validated clinical protocol
- Optional Supabase session note on dismiss/snooze only if configured

### Potential Improvements
- Examiner “force wellness prompt” control for viva demos under 45s
- Log acceptance vs dismiss rates for Chapter 5 analysis

### Relation to Dissertation
Implements the wellness intervention arm of the adaptive system for Chapter 4, supporting the research question on whether behavioural estimates can trigger overload-reducing interface changes without medicalising the user experience.

---

## Sample-date realism pass

### Date
2026-08-15

### Objective
Make sample workplace timestamps and implementation-log chronology look realistic for dissertation presentation and live demos.

### Features Implemented
- Sample JSON re-authored around scenario day `2026-03-18` with a multi-day spread (today / yesterday / earlier in the week)
- Runtime date alignment via `lib/alignSampleDates.js` so scenario “today” always maps to the evaluator’s real local date
- `IMPLEMENTATION_LOG.md` milestone dates staggered across Feb–Jun 2026 instead of a single build day

### Files Created
- `lib/alignSampleDates.js`

### Files Modified
- `data/emails.json`, `data/tasks.json`, `data/notifications.json`, `data/calendar.json`, `data/activity.json`
- `context/AppDataContext.js`
- `components/dashboard/CalendarWidget.js`, `ActivityFeed.js`
- `IMPLEMENTATION_LOG.md`

### Design Decisions and Rationale
- Keep authored JSON stable for version control, but shift at load time so “Today” labels remain correct on any evaluation day

### Relation to Dissertation
Improves ecological validity of screenshots/tables and supports a credible implementation timeline in Chapter 4.

---

## Focus Mode explainability pass

### Date
2026-08-16

### Objective
Make High Cognitive Load / Focus Mode adaptations obvious and tangible for examiners, without medicalising the experience.

### Features Implemented
- Brief Focus activation overlay (≈2.8s) listing what the interface did
- Persistent Focus banner: panel count reduction (9 → 3) + “what disappeared” checklist with distraction count
- Behaviour Status shows simple ↑↓ reasons (typing speed, pauses, corrections, consistency)
- Leaner Focus chrome: Exit focus moved into a single overflow menu
- Breathing CTA renamed to “Take a 60-second reset”
- Smoother 300–400ms fade/slide when secondary widgets leave the dashboard
- High-load dashboard summary strip when Focus is off but decluttering is active

### Files Created
- `lib/adaptationSummary.js`
- `components/focus/FocusActivationOverlay.js`

### Files Modified
- `components/focus/FocusModeView.js`
- `components/focus/BreakReminder.js`
- `components/adaptive/BehaviourStatusWidget.js`
- `components/adaptive/FocusBanner.js`
- `components/dashboard/DashboardView.js`
- `components/layout/AppShell.js`
- `IMPLEMENTATION_LOG.md`

### Design Decisions and Rationale
- Explain *what changed* and *why* at activation time so the research contribution is visible without reading Chapter 4 first
- Keep language as Estimated Cognitive Load / Behaviour Estimate

### Relation to Dissertation
Strengthens Chapter 4 adaptive-interaction narrative and viva demos by making interface adaptation self-evident.

---

## Focus Mode transparency copy pass

### Date
2026-08-16

### Objective
Tighten Focus Mode explainability wording for academic tone and add a Why? transparency panel.

### Features Implemented
- Renamed “What disappeared” → “Interface Simplifications”
- Copy: estimated load increased “based on recent interaction behaviour”
- “Why?” control opens Estimated-from checklist (pauses / corrections / consistency) with non-medical privacy note

### Files Created
- `components/focus/FocusWhyPanel.js`

### Files Modified
- `lib/adaptationSummary.js` (`getExplainabilityReasons`)
- `components/focus/FocusModeView.js`
- `components/focus/FocusActivationOverlay.js`
- `components/adaptive/FocusBanner.js`
- `IMPLEMENTATION_LOG.md`

### Relation to Dissertation
Supports Interaction Design principles of transparency, explainability, and trust in Chapter 4.

---

## Focus Reset wellness redesign

### Date
2026-08-16

### Objective
Soften the wellness intervention into a non-patronising Focus Reset with agency, transparency, and a graduated delay after Focus Mode.

### Features Implemented
- Title/copy: Focus Reset; personalised greeting; behavioural (not medical) framing
- Actionable stretch cards; timed breathing guide (4–2–4–2) with ≈60s label
- Actions: Start 60-Second Reset, Continue Working, Remind Me Later (15 min snooze)
- “Don’t suggest another reset today” (localStorage mute)
- “Why am I seeing this?” explainability disclosure
- Sustained high-load trigger raised to 10 minutes (Focus Mode still immediate)
- Research Panel “Preview Focus Reset” for viva demos

### Files Created
- `lib/wellnessPrefs.js`

### Files Modified
- `context/WorkloadContext.js`
- `components/adaptive/WellnessPrompt.js`
- `components/adaptive/BreathingCircle.js`
- `components/adaptive/ResearchPanel.js`
- `components/focus/BreakReminder.js`
- `IMPLEMENTATION_LOG.md`

### Relation to Dissertation
Documents a graduated adaptive response (Normal → Focus Mode → Focus Reset) suitable for Chapter 4 interaction-design rationale.

---

## Workspace Status & progressive adaptation pass

### Date
2026-08-16

### Objective
Align UI language with behavioural estimation (not measured cognition) and make Calm → Elevated → High → Focus Reset progression clearer.

### Features Implemented
- Renamed primary status to Workspace Status; Neutral → Elevated; High shortened
- Removed developer `calculateBehaviourState()` UI text; friendlier confidence copy
- Expandable Behaviour Estimate method + “No email content is analysed”
- Progressive Elevated cues: highlighted priorities, stronger badges, sidebar suggestion
- High expands Priorities / Tasks and hides Analytics from navigation
- New `/analytics` route so hiding Analytics is a visible chrome adaptation

### Files Created
- `app/analytics/page.js`

### Files Modified
- `lib/constants.js`, `lib/adaptationRules.js`
- `components/adaptive/BehaviourStatusWidget.js`, `WorkloadBadge.js`
- `components/layout/Sidebar.js`
- `components/dashboard/DashboardView.js`, `PriorityWidget.js`
- `components/notifications/NotificationPanel.js`
- `IMPLEMENTATION_LOG.md`

### Relation to Dissertation
Supports a progressive adaptation narrative (Calm → Elevated → High → sustained Focus Reset) for Chapter 4.

---

## Inbox explainability, Compose adaptation & Daily Reflection

### Date
2026-08-16

### Objective
Extend adaptation beyond dashboard chrome into Inbox, Compose, Analytics, and end-of-day reflection for stronger Chapter 4 evidence.

### Features Implemented
- Behaviour-aware Inbox copy; Showing X of Y + temporarily hidden counts
- Expandable “Priority because” reasons on email detail
- Hidden-for-Focus strip with Show all (emails not deleted)
- Compose Behaviour Estimate chip + high-load / long-pause draft suggestion
- Analytics rebuilt around research metrics (workload bars, focus sessions, delayed notifications)
- Daily Reflection page summarising workplace interaction (non-medical)
- Session metric counters in `sessionStorage` for Focus / Reset / drafts

### Files Created
- `lib/emailPriorityReasons.js`
- `lib/researchMetrics.js`
- `app/reflection/page.js`

### Files Modified
- `app/inbox/page.js`, `app/compose/page.js`, `app/analytics/page.js`
- `components/email/EmailDetail.js`
- `components/layout/Sidebar.js`
- `context/WorkloadContext.js`, `components/adaptive/WellnessPrompt.js`
- `IMPLEMENTATION_LOG.md`

### Relation to Dissertation
Demonstrates explainable adaptive systems and a full interaction loop (estimate → adapt → reflect) suitable for Chapter 4 figures and evaluation.

---

## Adaptive Tasks page pass

### Date
2026-08-16

### Objective
Bring Tasks to the same explainability / adaptation standard as Inbox and Compose, including behaviour-triggered Focus suggestions.

### Features Implemented
- Adaptive subtitle; effort minutes on tasks; expandable Why? reasons
- Elevated/High visual emphasis (border, soft accent fill, larger checkbox)
- Suggested Focus panel with per-task time estimates
- Focus/High collapse: Today’s Priority vs Other Tasks (Show later)
- Behaviour Estimate guidance copy on Elevated/High
- Task-switch detection (≥6 tasks / 10 min) → Enable Focus Mode suggestion
- Completion fade/layout animation via Framer Motion

### Files Created
- `lib/taskPriorityReasons.js`
- `components/tasks/SuggestedFocusPanel.js`

### Files Modified
- `data/tasks.json` (effortMinutes, meetingRelated)
- `components/tasks/TaskItem.js`, `TaskList.js`
- `app/tasks/page.js`
- `components/layout/Sidebar.js`
- `IMPLEMENTATION_LOG.md`

### Relation to Dissertation
Shows adaptation driven by interaction behaviour (task switching), not only elapsed time - a core Interaction Design claim for Chapter 4.

---

## Behaviour Insights page redesign

### Date
2026-08-16

### Objective
Reposition Analytics as Behaviour Insights with narrative timeline, privacy framing, and adaptive-action storytelling for Chapter 4.

### Features Implemented
- Renamed surface to Behaviour Insights (nav: Insights)
- Workspace-state timeline + distribution bars; current state label
- Outcome metrics renamed to adaptive-behaviour language
- Privacy card; Today's Adaptive Actions narrative list
- Focus continuity: estimated uninterrupted focus + longest session
- Daily Reflection handoff card
- Session timeline recording on level / Focus Mode changes

### Files Modified
- `app/analytics/page.js`
- `lib/researchMetrics.js`
- `context/WorkloadContext.js`
- `components/layout/Sidebar.js`
- `lib/adaptationSummary.js`
- `components/dashboard/AnalyticsWidget.js`
- `IMPLEMENTATION_LOG.md`

### Relation to Dissertation
Strengthens ethical transparency and makes adaptive outcomes legible as a story rather than generic analytics.

---

## Compose Interaction Analysis pass

### Date
2026-08-16

### Objective
Make Compose the academic centre of the prototype: transparent metrics, privacy framing, and a visible analysis pipeline.

### Features Implemented
- Renamed panel to Interaction Analysis
- Per-metric explanations (WPM, pause, backspace, Typing Rhythm, confidence)
- Confidence as Building estimate… / Low / Medium / High
- Animated metric value updates while typing
- Current Behaviour Summary + workspace estimate
- Keyboard → Feature Extraction → Rule Engine → Estimate → Adaptive Interface diagram
- Bold privacy copy; typing analysed / content ignored note
- Removed Send button; Research Prototype / sending disabled notice

### Files Modified
- `app/compose/page.js`
- `lib/adaptationSummary.js` (Typing Rhythm wording)
- `IMPLEMENTATION_LOG.md`

### Relation to Dissertation
Connects Chapter 3 architecture (input → features → rules → adaptation) to a live examiner-facing instrument in Chapter 4.

---

## Demo simulate injectors (sidebar)

### Date
2026-08-05

### Objective
Let examiners inject sample content under adaptation without a second control panel.

### Features Implemented
- `+Urgent` email, `+Task` (high priority), `+5 Notifs` in sidebar Demo controls
- AppData inject helpers (prototype-only sample data)
- Kept workload override / Focus Reset in the same compact Demo block

### Files Modified
- `context/AppDataContext.js`
- `components/adaptive/DemoControls.js`
- `IMPLEMENTATION_LOG.md`

---

## Compose metric number animation

### Date
2026-08-05

### Objective
Make Interaction Analysis values feel live while typing, not like abrupt text swaps.

### Features Implemented
- Spring-interpolated `AnimatedNumber` for WPM, pause, backspace, rhythm
- Subtle accent scale flash on each value change
- Blur/slide crossfade for Confidence labels
- Wired into Compose MetricRow

### Files Modified
- `components/ui/AnimatedNumber.js` (new)
- `app/compose/page.js`
- `IMPLEMENTATION_LOG.md`

---

## Sidebar demo controls + accelerated session clock

### Date
2026-08-05

### Objective
Keep examiner controls out of the main chrome and make sustained-load demos practical without waiting real minutes.

### Features Implemented
- Moved workload override + Focus Reset preview into sidebar Demo controls
- Session time display (demo-accelerated)
- Clock speed 1× / 30× / 60× (default 30× so 10 min Focus Reset ≈ 20s wall)
- Wellness trigger, snooze, and normal-notification delay respect demo speed
- Compact session/speed strip when sidebar collapses on High load
- Workload badge remains in the top bar for status at a glance

### Files Modified
- `components/adaptive/DemoControls.js` (new)
- `components/layout/Sidebar.js`
- `components/layout/TopBar.js`
- `context/WorkloadContext.js`
- `lib/format.js`
- `lib/notificationFilter.js`
- `components/notifications/NotificationPanel.js`
- `IMPLEMENTATION_LOG.md`

### Relation to Dissertation
Supports viva demonstration of graduated adaptation without compromising the designed 10-minute Focus Reset threshold in conceptual time.
