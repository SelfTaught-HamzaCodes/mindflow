"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Mail } from "lucide-react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatRelativeDay, formatTime } from "@/lib/format";
import {
  getEmailPriorityReasons,
  isEmailPrioritised,
} from "@/lib/emailPriorityReasons";

export default function EmailDetail({ email }) {
  const [whyOpen, setWhyOpen] = useState(false);

  if (!email) {
    return (
      <EmptyState
        icon={Mail}
        title="Select an email"
        description="Choose a message from the list to read its contents."
      />
    );
  }

  const reasons = getEmailPriorityReasons(email);
  const prioritised = isEmailPrioritised(email);

  return (
    <article className="flex h-full flex-col" aria-label="Email detail">
      <header className="border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
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
          {email.today ? <Badge tone="calm">Today</Badge> : null}
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          {email.subject}
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <p className="font-medium text-[var(--text-primary)]">
              {email.from}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {email.fromEmail}
            </p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {formatRelativeDay(email.receivedAt)} · {formatTime(email.receivedAt)}
          </p>
        </div>

        {prioritised && reasons.length > 0 ? (
          <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] px-3 py-2.5">
            <button
              type="button"
              onClick={() => setWhyOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
              aria-expanded={whyOpen}
            >
              <span className="text-xs font-medium text-[var(--text-primary)]">
                Priority because
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
            ) : (
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Expand to see why this message stays visible under adaptation.
              </p>
            )}
          </div>
        ) : null}
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
          {email.body}
        </p>
      </div>
    </article>
  );
}
