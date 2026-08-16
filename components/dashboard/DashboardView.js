"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppData } from "@/context/AppDataContext";
import { useWorkload } from "@/context/WorkloadContext";
import { usePrefs } from "@/context/PrefsContext";
import { filterEmails, filterTasks } from "@/lib/adaptationRules";
import { PRIMARY_FOCUS } from "@/lib/userPrefs";
import PriorityWidget from "@/components/dashboard/PriorityWidget";
import AnalyticsWidget from "@/components/dashboard/AnalyticsWidget";
import CalendarWidget from "@/components/dashboard/CalendarWidget";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import TaskList from "@/components/tasks/TaskList";
import BehaviourStatusWidget from "@/components/adaptive/BehaviourStatusWidget";
import ResearchPanel from "@/components/adaptive/ResearchPanel";
import FocusModeView from "@/components/focus/FocusModeView";
import Card from "@/components/ui/Card";

function greetingFor(firstName, primaryFocus) {
  const name = firstName && firstName !== "there" ? firstName : null;
  const lead =
    primaryFocus === PRIMARY_FOCUS.INBOX
      ? "Inbox first"
      : primaryFocus === PRIMARY_FOCUS.TASKS
        ? "Tasks first"
        : primaryFocus === PRIMARY_FOCUS.CALENDAR
          ? "Today's schedule"
          : "Your priorities";
  return name ? `${lead}, ${name}` : lead;
}

// Shared enter/exit so panels dont feel like they just pop out of existence
const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
  transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
};

/**
 * Standard dashboard vs Focus Mode swap.
 * Filtering happens here (not inside each widget) so every surface respects
 * the same adaptation config — otherwise Insights and Tasks drifted apart.
 */
export default function DashboardView() {
  const { emails, tasks, toggleTaskStatus } = useAppData();
  const { firstName, prefs } = usePrefs();
  const { adaptation, focusMode } = useWorkload();

  const visibleEmails = filterEmails(emails, adaptation);
  const visibleTasks = filterTasks(tasks, adaptation);
  const showSecondary = adaptation.showSecondaryWidgets;
  const showAnalytics = adaptation.showAnalytics;
  const showActivity = adaptation.showActivityFeed !== false && showSecondary;
  const showResearch = adaptation.showResearchPanel !== false;

  return (
    <AnimatePresence mode="wait">
      {focusMode ? (
        // Full replace, not a overlay — clearer for examiners what Focus does
        <FocusModeView key="focus" />
      ) : (
        <motion.div
          key="standard"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          className={
            adaptation.increaseWhitespace ? "space-y-6" : "space-y-4"
          }
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              {greetingFor(firstName, prefs.primaryFocus)}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {prefs.learnedNote ||
                "A few surfaces stay tucked away until you need them."}
            </p>
          </div>

          <BehaviourStatusWidget />

          <div
            className={`grid gap-4 transition-[gap] duration-300 ${
              // Single column under High so priorities get the full width
              adaptation.increaseWhitespace || (!showAnalytics && !showSecondary)
                ? "grid-cols-1 gap-6"
                : "lg:grid-cols-2"
            }`}
          >
            <motion.div
              layout
              transition={{ duration: 0.36 }}
              className={
                adaptation.expandPriorities ? "lg:col-span-1" : undefined
              }
            >
              <PriorityWidget
                emails={visibleEmails}
                tasks={visibleTasks}
                highlight={adaptation.highlightPriorities}
                expand={adaptation.expandPriorities}
              />
            </motion.div>

            <AnimatePresence initial={false} mode="popLayout">
              {showAnalytics ? (
                <motion.div key="analytics" layout {...fadeSlide}>
                  <AnalyticsWidget emails={emails} tasks={tasks} />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false} mode="popLayout">
              {showSecondary ? (
                <motion.div key="calendar" layout {...fadeSlide}>
                  <CalendarWidget />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false} mode="popLayout">
              {showActivity ? (
                <motion.div key="activity" layout {...fadeSlide}>
                  <ActivityFeed />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <Card
            className={
              adaptation.expandPriorities
                ? "border-orange-100 ring-1 ring-orange-100"
                : undefined
            }
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2
                  className={`font-semibold text-[var(--text-primary)] ${
                    adaptation.expandPriorities ? "text-base" : "text-sm"
                  }`}
                >
                  Task overview
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {adaptation.showLowPriorityTasks
                    ? "All open priorities visible"
                    : "Low-priority tasks hidden to reduce clutter"}
                </p>
              </div>
            </div>
            <TaskList
              tasks={visibleTasks.filter((t) => t.status !== "done")}
              onToggle={toggleTaskStatus}
              highlightPriorities={adaptation.highlightPriorities}
            />
          </Card>

          {showResearch ? <ResearchPanel /> : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
