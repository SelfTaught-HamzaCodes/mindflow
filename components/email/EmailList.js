"use client";

import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatRelativeDay, formatTime } from "@/lib/format";
import { Inbox } from "lucide-react";

/**
 * Email list for inbox / priority widget.
 * highlightPriorities bumps high/important rows visually under Elevated+ —
 * cheaper than reordering and less jarring mid-scroll.
 */
export default function EmailList({
  emails,
  selectedId,
  onSelect,
  highlightPriorities = false,
}) {
  if (!emails?.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="No emails in this view"
        description="Adaptation or Priority Focus Mode may be hiding lower-priority messages."
      />
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)]" role="listbox" aria-label="Emails">
      {emails.map((email) => {
        const selected = email.id === selectedId;
        const emphasize =
          highlightPriorities &&
          (email.priority === "high" || email.important);

        return (
          <li key={email.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(email.id)}
              className={`flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] ${
                selected
                  ? "bg-[var(--accent-soft)]"
                  : "hover:bg-[var(--surface-muted)]"
              } ${emphasize ? "border-l-2 border-l-[var(--accent)]" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`truncate text-sm ${
                    email.unread
                      ? "font-semibold text-[var(--text-primary)]"
                      : "font-medium text-[var(--text-secondary)]"
                  }`}
                >
                  {email.from}
                </span>
                <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                  {email.today
                    ? formatTime(email.receivedAt)
                    : formatRelativeDay(email.receivedAt)}
                </span>
              </div>
              <p
                className={`truncate text-sm ${
                  email.unread
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {email.subject}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {email.preview}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge
                  tone={
                    email.priority === "high"
                      ? "danger"
                      : email.priority === "medium"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {email.priority}
                </Badge>
                {email.important ? <Badge tone="accent">Important</Badge> : null}
                {email.unread ? <Badge tone="calm">Unread</Badge> : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
