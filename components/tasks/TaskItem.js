"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Clock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatRelativeDay } from "@/lib/format";
import {
  formatEffort,
  getTaskEffortMinutes,
  getTaskPriorityReasons,
  isPriorityTask,
} from "@/lib/taskPriorityReasons";

export default function TaskItem({
  task,
  onToggle,
  onInspect,
  highlightPriorities = false,
  emphasizeStyle = false,
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const done = task.status === "done";
  const prioritize = isPriorityTask(task) || task.priority === "high" || task.important;
  const emphasize =
    (highlightPriorities || emphasizeStyle) && prioritize && !done;
  const effort = getTaskEffortMinutes(task);
  const reasons = getTaskPriorityReasons(task);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: done ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, y: 12, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-sm)] ${
        emphasize
          ? "border-[var(--accent)]/40 bg-[var(--accent-soft)]/40 ring-1 ring-[var(--accent)]/25"
          : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 flex shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
            emphasize ? "h-6 w-6" : "h-5 w-5"
          } ${
            done
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--border-strong)] bg-white hover:border-[var(--accent)]"
          }`}
          aria-label={
            done ? `Mark ${task.title} as not done` : `Complete ${task.title}`
          }
          aria-pressed={done}
        >
          {done ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="w-full text-left focus-visible:outline-none"
            onClick={() => onInspect?.(task.id)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`text-sm font-medium ${
                  done
                    ? "text-[var(--text-muted)] line-through"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {task.title}
              </p>
              <Badge
                tone={
                  task.priority === "high"
                    ? "danger"
                    : task.priority === "medium"
                      ? "warning"
                      : "neutral"
                }
              >
                {task.priority}
              </Badge>
              {task.important ? <Badge tone="accent">Important</Badge> : null}
              {task.today ? <Badge tone="calm">Due Today</Badge> : null}
              <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatEffort(effort)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {task.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
              <span>{task.category}</span>
              <span aria-hidden="true">·</span>
              <span>Due {formatRelativeDay(task.dueDate)}</span>
            </div>
          </button>

          {!done && prioritize && reasons.length > 0 ? (
            <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setWhyOpen((v) => !v);
                  onInspect?.(task.id);
                }}
                className="flex w-full items-center justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
                aria-expanded={whyOpen}
              >
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  Why?
                </span>
                {whyOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                )}
              </button>
              {whyOpen ? (
                <ul className="mt-2 space-y-1.5">
                  {reasons.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                    >
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      {r.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </motion.li>
  );
}
