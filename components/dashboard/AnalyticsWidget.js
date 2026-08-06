"use client";

import { BarChart3 } from "lucide-react";
import Card from "@/components/ui/Card";

/**
 * Secondary analytics widget - hidden under High Cognitive Load.
 */
export default function AnalyticsWidget({ emails, tasks }) {
  const unread = emails.filter((e) => e.unread).length;
  const highEmails = emails.filter((e) => e.priority === "high").length;
  const openTasks = tasks.filter((t) => t.status !== "done").length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const completion =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const stats = [
    { label: "Unread emails", value: unread },
    { label: "High-priority mail", value: highEmails },
    { label: "Open tasks", value: openTasks },
    { label: "Task completion", value: `${completion}%` },
  ];

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--text-secondary)]">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Behaviour Insights
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Sample adaptation summary · open Insights for detail
          </p>
        </div>
      </div>

      <dl className="mt-5 grid flex-1 grid-cols-2 content-stretch gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col justify-center rounded-xl bg-[var(--surface-muted)] px-3 py-3"
          >
            <dt className="text-[11px] text-[var(--text-muted)]">{s.label}</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
