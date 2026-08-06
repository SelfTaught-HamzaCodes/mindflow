"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function PriorityWidget({
  emails,
  tasks,
  highlight = false,
  expand = false,
}) {
  const priorityEmails = emails
    .filter((e) => e.important || e.priority === "high")
    .slice(0, expand ? 5 : 3);
  const priorityTasks = tasks
    .filter((t) => (t.important || t.priority === "high") && t.status !== "done")
    .slice(0, expand ? 5 : 3);

  return (
    <Card
      className={`h-full transition-shadow duration-300 ${
        highlight
          ? "ring-1 ring-orange-200 shadow-[0_8px_24px_rgba(251,146,60,0.12)]"
          : ""
      } ${expand ? "sm:p-6" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2
              className={`font-semibold text-[var(--text-primary)] ${
                expand ? "text-base" : "text-sm"
              }`}
            >
              Priorities
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {expand
                ? "Expanded view while Workspace Status is High"
                : "Important emails and tasks for today"}
            </p>
          </div>
        </div>
        <Badge tone="warning">{expand ? "Expanded" : "Focus"}</Badge>
      </div>

      <div
        className={`mt-5 grid gap-4 ${
          expand ? "lg:grid-cols-2" : "sm:grid-cols-2"
        }`}
      >
        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Emails
            </h3>
            <Link
              href="/inbox"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              Inbox <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-2">
            {priorityEmails.map((e) => (
              <li
                key={e.id}
                className="rounded-xl bg-[var(--surface-muted)] px-3 py-2"
              >
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {e.subject}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {e.from}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Tasks
            </h3>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              Tasks <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-2">
            {priorityTasks.map((t) => (
              <li
                key={t.id}
                className="rounded-xl bg-[var(--surface-muted)] px-3 py-2"
              >
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {t.title}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {t.category} · {t.priority}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Card>
  );
}
