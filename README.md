# Mindflow

**Designing an Emotion-Aware Adaptive Email and Task Manager to Reduce Workplace Stress**

Interaction Design Final Year Project - research prototype (not a commercial SaaS).

## Research question

Can behavioural interaction data be used to trigger adaptive interface changes that reduce cognitive overload?

## What this prototype does

Mindflow estimates **behavioural cognitive workload** from typing behaviour (speed, pauses, backspaces, consistency) and adapts the email/task interface accordingly.

It does **not** diagnose medical stress. UI labels use:

- Estimated Workload
- Estimated Cognitive Load
- Behaviour Estimate

## Adaptive features

1. **Behaviour analysis** - Calm / Neutral / High Cognitive Load
2. **Adaptive dashboard** - hides secondary widgets, analytics, and low-priority work under high load
3. **Notification filtering** - urgent/high remain; low priority disappears under high load
4. **Priority Focus Mode** - today's important emails and tasks only
5. **Wellness prompt** - breathing / short break reminder after sustained high load

## Tech stack

- Next.js App Router
- React
- Tailwind CSS
- JavaScript (no TypeScript)
- Lucide Icons
- Framer Motion
- React Context (no Redux)
- Optional Supabase persistence

## Important constraints

- Emails, tasks, and notifications are **sample/fake data** (JSON)
- No Gmail, Outlook, or Google API connections
- Demo user: Alex Chen · Sales Coordinator

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo tip for examiners

Use **Demo override** in the top bar to force Calm / Neutral / High Cognitive Load without reproducing typing patterns. Or type in **Compose** to drive a live behaviour estimate.

## Optional Supabase

1. Copy `.env.example` to `.env.local`
2. Add project URL + anon key
3. Run `supabase/schema.sql` in the Supabase SQL editor

Without these variables, the app runs entirely on local JSON / in-memory state.

## Project structure

```
app/                 Routes (dashboard, inbox, tasks, compose)
components/          UI, layout, adaptive, email, tasks, dashboard
context/             AppDataContext, WorkloadContext
hooks/               useTypingBehaviour
lib/                 Estimator, adaptation rules, notification filter, Supabase
data/                Sample emails, tasks, notifications, user
supabase/            Optional SQL schema
IMPLEMENTATION_LOG.md
```

## Dissertation support

See `IMPLEMENTATION_LOG.md` for milestone-by-milestone implementation notes suitable for Chapter 4 (Implementation). The in-app **Research Panel** exposes live metrics and estimator thresholds for viva demonstrations.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # start production server
npm run lint     # eslint
```
