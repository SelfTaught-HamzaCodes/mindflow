"use client";

import { Clock, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import {
  formatEffort,
  getSuggestedFocusTasks,
  getTaskEffortMinutes,
} from "@/lib/taskPriorityReasons";

export default function SuggestedFocusPanel({ tasks }) {
  const suggested = getSuggestedFocusTasks(tasks, 3);
  if (!suggested.length) return null;

  const total = suggested.reduce(
    (sum, t) => sum + getTaskEffortMinutes(t),
    0,
  );

  return (
    <Card className="border-amber-100 bg-gradient-to-br from-amber-50/90 to-white">
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-amber-800 shadow-sm">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-amber-950">
            Suggested Focus
          </h2>
          <p className="mt-0.5 text-xs text-amber-900/80">
            Finish these before checking new email
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {suggested.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-white/90 px-3 py-2.5 ring-1 ring-amber-100"
          >
            <p className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]">
              {task.title}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--text-secondary)]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatEffort(getTaskEffortMinutes(task))}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-amber-900/70">
        About {total} minutes of priority work · based on due date, importance,
        and workspace state
      </p>
    </Card>
  );
}
