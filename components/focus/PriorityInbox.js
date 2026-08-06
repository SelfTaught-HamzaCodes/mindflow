"use client";

import Link from "next/link";
import { Inbox, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatTime } from "@/lib/format";

/**
 * Focus Mode - Priority Inbox only (today's important emails).
 */
export default function PriorityInbox({ emails }) {
  const items = (emails || []).slice(0, 8);

  return (
    <Card className="h-full" aria-label="Priority Inbox">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Inbox className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Priority Inbox
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Today&apos;s important messages only
            </p>
          </div>
        </div>
        <Link
          href="/inbox"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
        >
          Open inbox <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No priority messages"
          description="No important emails for today in the sample dataset."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((email) => (
            <li key={email.id}>
              <Link
                href="/inbox"
                className="block rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3 transition-colors hover:bg-white hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {email.from}
                  </p>
                  <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                    {formatTime(email.receivedAt)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                  {email.subject}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="danger">Priority</Badge>
                  {email.unread ? <Badge tone="calm">Unread</Badge> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
