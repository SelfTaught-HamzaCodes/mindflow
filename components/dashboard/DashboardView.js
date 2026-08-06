"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppData } from "@/context/AppDataContext";
import { useWorkload } from "@/context/WorkloadContext";
import { filterEmails, filterTasks } from "@/lib/adaptationRules";
import {
  WORKLOAD_LABELS,
  WORKSPACE_STATUS_TITLE,
  WORKLOAD_LEVELS,
} from "@/lib/constants";
import {
  getDistractionCount,
  getHiddenAdaptations,
} from "@/lib/adaptationSummary";
import PriorityWidget from "@/components/dashboard/PriorityWidget";
import AnalyticsWidget from "@/components/dashboard/AnalyticsWidget";
import CalendarWidget from "@/components/dashboard/CalendarWidget";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import TaskList from "@/components/tasks/TaskList";
import BehaviourStatusWidget from "@/components/adaptive/BehaviourStatusWidget";
import ResearchPanel from "@/components/adaptive/ResearchPanel";
import FocusModeView from "@/components/focus/FocusModeView";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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
  const { emails, tasks, toggleTaskStatus, user } = useAppData();
  const { level, adaptation, focusMode } = useWorkload();

  const visibleEmails = filterEmails(emails, adaptation);
  const visibleTasks = filterTasks(tasks, adaptation);
  const showSecondary = adaptation.showSecondaryWidgets;
  const showAnalytics = adaptation.showAnalytics;
  // Banner only when something actually got hidden — otherwise it's noise
  const decluttering =
    level === WORKLOAD_LEVELS.HIGH ||
    !showAnalytics ||
    !showSecondary;
  const hidden = getHiddenAdaptations(adaptation, { focusMode: false });
  const distractionCount = getDistractionCount(adaptation, {
    focusMode: false,
  });

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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Adaptive workspace for {user.name}. Interface density responds
                to {WORKSPACE_STATUS_TITLE.toLowerCase()}.
              </p>
            </div>
            <Badge
              tone={
                level === "calm"
                  ? "calm"
                  : level === "high"
                    ? "high"
                    : "warning"
              }
            >
              {WORKSPACE_STATUS_TITLE}: {WORKLOAD_LABELS[level]}
            </Badge>
          </div>

          <BehaviourStatusWidget />

          <AnimatePresence initial={false}>
            {decluttering && hidden.length > 0 ? (
              <motion.div
                key="adaptation-summary"
                {...fadeSlide}
                className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3"
                role="status"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-orange-950">
                    Interface adapted to estimated cognitive load
                  </p>
                  <p className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-orange-900">
                    {distractionCount} distractions removed
                  </p>
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {hidden.map((entry) => (
                    <li
                      key={entry.id}
                      className="text-xs text-orange-900/80"
                    >
                      ✓ {entry.label}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : null}
          </AnimatePresence>

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
              {showSecondary ? (
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

          <ResearchPanel />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
