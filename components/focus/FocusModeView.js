"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Focus, HelpCircle, MoreHorizontal, X } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { useWorkload } from "@/context/WorkloadContext";
import { filterEmails, filterTasks } from "@/lib/adaptationRules";
import { PANEL_COUNTS } from "@/lib/adaptationSummary";
import PriorityInbox from "@/components/focus/PriorityInbox";
import TodaysTasks from "@/components/focus/TodaysTasks";
import BreakReminder from "@/components/focus/BreakReminder";
import FocusWhyPanel from "@/components/focus/FocusWhyPanel";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const item = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Focus Mode composition: Priority Inbox · Today's Tasks · Break Reminder.
 * Everything else on the dashboard is gone on purpose — research needs a
 * clear "minimum viable workspace" so participants notice the adaptation.
 */
export default function FocusModeView() {
  const { emails, tasks, toggleTaskStatus } = useAppData();
  const { adaptation, setFocusMode } = useWorkload();
  const [menuOpen, setMenuOpen] = useState(false);
  // Why panel is opt-in so we dont lecture every time Focus auto-fires
  const [whyOpen, setWhyOpen] = useState(false);

  const priorityEmails = filterEmails(emails, adaptation);
  const todaysTasks = filterTasks(tasks, adaptation);

  return (
    <motion.div
      key="focus-mode"
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
      className="space-y-5"
    >
      <motion.div
        variants={item}
        className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50/40 px-5 py-4 shadow-[var(--shadow-sm)]"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
              <Focus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-950">
                Focus Mode Activated
              </p>
              <p className="mt-1 text-sm text-sky-900/80">
                Estimated cognitive load increased based on recent interaction
                behaviour. We&apos;ve reduced visible information from{" "}
                {PANEL_COUNTS.full} panels to {PANEL_COUNTS.focus}.
              </p>
              <button
                type="button"
                onClick={() => setWhyOpen(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-800 shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Why?
              </button>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-800 shadow-sm hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Focus Mode options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-[var(--border)] bg-white py-1 shadow-[var(--shadow-lg)]">
                <p className="px-3 py-2 text-[11px] text-[var(--text-muted)]">
                  {PANEL_COUNTS.focus} surfaces only
                </p>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                  onClick={() => {
                    setMenuOpen(false);
                    setWhyOpen(true);
                  }}
                >
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Why adapted?
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                  onClick={() => {
                    setMenuOpen(false);
                    setFocusMode(false);
                  }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Exit focus
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
        <motion.div variants={item}>
          <PriorityInbox emails={priorityEmails} />
        </motion.div>
        <motion.div variants={item}>
          <TodaysTasks tasks={todaysTasks} onToggle={toggleTaskStatus} />
        </motion.div>
        <motion.div variants={item}>
          <BreakReminder />
        </motion.div>
      </div>

      <FocusWhyPanel open={whyOpen} onClose={() => setWhyOpen(false)} />
    </motion.div>
  );
}
