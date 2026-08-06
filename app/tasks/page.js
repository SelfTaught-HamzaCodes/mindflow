"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Focus } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TaskList from "@/components/tasks/TaskList";
import SuggestedFocusPanel from "@/components/tasks/SuggestedFocusPanel";
import { useAppData } from "@/context/AppDataContext";
import { useWorkload } from "@/context/WorkloadContext";
import { filterTasks } from "@/lib/adaptationRules";
import { WORKLOAD_LABELS, WORKLOAD_LEVELS } from "@/lib/constants";
import { isPriorityTask } from "@/lib/taskPriorityReasons";

const SWITCH_WINDOW_MS = 10 * 60 * 1000;
const SWITCH_THRESHOLD = 6;

export default function TasksPage() {
  const { tasks, toggleTaskStatus } = useAppData();
  const { adaptation, focusMode, level, setFocusMode } = useWorkload();
  const [showOther, setShowOther] = useState(false);
  const [switchSuggestion, setSwitchSuggestion] = useState(false);
  const [dismissedSwitchTip, setDismissedSwitchTip] = useState(false);
  const switchesRef = useRef([]);

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done"),
    [tasks],
  );

  const adaptedOpen = useMemo(
    () => filterTasks(tasks, adaptation).filter((t) => t.status !== "done"),
    [tasks, adaptation],
  );

  const priorityOpen = useMemo(
    () =>
      adaptedOpen.filter(
        (t) => isPriorityTask(t) || (t.today && (t.important || t.priority === "high")),
      ),
    [adaptedOpen],
  );

  const collapseOther = focusMode || level === WORKLOAD_LEVELS.HIGH;

  const listTasks = useMemo(() => {
    if (!collapseOther) return adaptedOpen;
    if (showOther) return openTasks;
    return priorityOpen.length > 0 ? priorityOpen : adaptedOpen;
  }, [collapseOther, showOther, adaptedOpen, openTasks, priorityOpen]);

  const otherCount = Math.max(0, openTasks.length - listTasks.length);

  const hiddenByAdaptation = useMemo(() => {
    const ids = new Set(adaptedOpen.map((t) => t.id));
    return openTasks.filter((t) => !ids.has(t.id));
  }, [openTasks, adaptedOpen]);

  const noteInspect = useCallback(
    (taskId) => {
      const now = Date.now();
      switchesRef.current = [
        ...switchesRef.current.filter((s) => now - s.at < SWITCH_WINDOW_MS),
        { id: taskId, at: now },
      ];
      const unique = new Set(switchesRef.current.map((s) => s.id));
      if (
        unique.size >= SWITCH_THRESHOLD &&
        !focusMode &&
        !dismissedSwitchTip
      ) {
        setSwitchSuggestion(true);
      }
    },
    [focusMode, dismissedSwitchTip],
  );

  const emphasize =
    adaptation.highlightPriorities || level !== WORKLOAD_LEVELS.CALM;

  const completedCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          Tasks
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Tasks are automatically prioritised according to due date, importance
          and current workspace state.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 font-medium text-[var(--text-secondary)]">
            {openTasks.length} open · {completedCount} done
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[var(--text-muted)] ring-1 ring-[var(--border)]">
            Workspace Status: {WORKLOAD_LABELS[level]}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {switchSuggestion && !focusMode ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3"
            role="status"
          >
            <p className="text-sm font-medium text-sky-950">Suggestion</p>
            <p className="mt-1 text-sm text-sky-900/85">
              You&apos;ve switched between {SWITCH_THRESHOLD}+ tasks in the last
              10 minutes. Would you like to temporarily focus on only today&apos;s
              highest priority tasks?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setFocusMode(true);
                  setSwitchSuggestion(false);
                }}
              >
                <Focus className="h-3.5 w-3.5" aria-hidden="true" />
                Enable Focus Mode
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setDismissedSwitchTip(true);
                  setSwitchSuggestion(false);
                }}
              >
                Not now
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {(level === WORKLOAD_LEVELS.NEUTRAL || level === WORKLOAD_LEVELS.HIGH) &&
      !focusMode ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
          <p className="text-xs font-medium text-[var(--text-muted)]">
            Behaviour Estimate · {WORKLOAD_LABELS[level]}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {level === WORKLOAD_LEVELS.HIGH
              ? "Sustained demand detected. Complete one priority task before opening another."
              : "You're exploring several items. Consider completing one task before opening another."}
          </p>
        </div>
      ) : null}

      {!focusMode && level !== WORKLOAD_LEVELS.CALM ? (
        <SuggestedFocusPanel tasks={tasks} />
      ) : null}

      {collapseOther ? (
        <Card className="border-sky-100 bg-sky-50/40">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Today&apos;s Priority
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {listTasks.length} task{listTasks.length === 1 ? "" : "s"}
              {showOther ? " (including later items)" : ""}
            </p>
          </div>
          <TaskList
            tasks={listTasks}
            onToggle={toggleTaskStatus}
            onInspect={noteInspect}
            highlightPriorities
            emphasizeStyle
          />

          {otherCount > 0 || (showOther && openTasks.length > priorityOpen.length) ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-primary)]">
                Other Tasks · {showOther ? "Visible" : "Hidden"}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {showOther
                  ? "Showing all open tasks - you can collapse them again."
                  : `${otherCount} task${otherCount === 1 ? "" : "s"} reduced for focus - nothing is deleted`}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => setShowOther((v) => !v)}
              >
                {showOther ? "Hide other tasks" : "Show later"}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : (
        <Card>
          <TaskList
            tasks={listTasks}
            onToggle={toggleTaskStatus}
            onInspect={noteInspect}
            highlightPriorities={emphasize}
            emphasizeStyle={emphasize}
          />
          {hiddenByAdaptation.length > 0 ? (
            <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-primary)]">
                Hidden by adaptation
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {hiddenByAdaptation.length} lower-priority task
                {hiddenByAdaptation.length === 1 ? "" : "s"} - nothing deleted
              </p>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
