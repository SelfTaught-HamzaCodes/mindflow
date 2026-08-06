"use client";

import Link from "next/link";
import { CheckSquare, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import TaskList from "@/components/tasks/TaskList";

/**
 * Focus Mode - Today's important tasks only.
 */
export default function TodaysTasks({ tasks, onToggle }) {
  return (
    <Card className="h-full" aria-label="Today's tasks">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Today&apos;s Tasks
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Important work due today
            </p>
          </div>
        </div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
        >
          All tasks <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4">
        <TaskList
          tasks={tasks}
          onToggle={onToggle}
          highlightPriorities
        />
      </div>
    </Card>
  );
}
