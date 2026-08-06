"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmailList from "@/components/email/EmailList";
import EmailDetail from "@/components/email/EmailDetail";
import { useAppData } from "@/context/AppDataContext";
import { useWorkload } from "@/context/WorkloadContext";
import { filterEmails } from "@/lib/adaptationRules";
import { WORKLOAD_LABELS } from "@/lib/constants";

/**
 * Inbox respects the same adaptation filters as the dashboard.
 * "Show hidden" exists so participants can peek at what was filtered —
 * important for trust / transparency in evaluation.
 */
export default function InboxPage() {
  const { emails, selectedEmail, selectEmail } = useAppData();
  const { adaptation, focusMode, level } = useWorkload();
  const [showHidden, setShowHidden] = useState(false);

  const adaptedEmails = useMemo(
    () => filterEmails(emails, adaptation),
    [emails, adaptation],
  );
  // Diff against full set so we can offer a reveal without undoing adaptation
  const hiddenEmails = useMemo(() => {
    const visibleIds = new Set(adaptedEmails.map((e) => e.id));
    return emails.filter((e) => !visibleIds.has(e.id));
  }, [emails, adaptedEmails]);

  const visibleEmails = showHidden ? emails : adaptedEmails;
  const filtering = hiddenEmails.length > 0 && !showHidden;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          Behaviour-aware Inbox
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {focusMode
            ? "Priority emails remain visible when Focus Mode is active."
            : "Email priority adapts to the current estimated workload."}{" "}
          Sample data only - no Gmail or Outlook connection.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 font-medium text-[var(--text-secondary)]">
            Showing {adaptedEmails.length} of {emails.length} emails
          </span>
          {filtering ? (
            <span className="rounded-full bg-orange-50 px-2.5 py-1 font-medium text-orange-800">
              {hiddenEmails.length} temporarily hidden
            </span>
          ) : null}
          <span className="rounded-full bg-white px-2.5 py-1 text-[var(--text-muted)] ring-1 ring-[var(--border)]">
            Workspace Status: {WORKLOAD_LABELS[level]}
          </span>
        </div>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="grid min-h-[32rem] lg:grid-cols-[22rem_1fr]">
          <div className="flex flex-col border-b border-[var(--border)] lg:border-b-0 lg:border-r">
            <EmailList
              emails={visibleEmails}
              selectedId={selectedEmail?.id}
              onSelect={selectEmail}
              highlightPriorities={adaptation.highlightPriorities}
            />

            {hiddenEmails.length > 0 ? (
              <div className="mt-auto border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {focusMode ? "Hidden for Focus Mode" : "Hidden by adaptation"}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {hiddenEmails.length} low-priority email
                  {hiddenEmails.length === 1 ? "" : "s"}
                  {showHidden ? " shown below" : " - nothing is deleted"}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => setShowHidden((v) => !v)}
                >
                  {showHidden ? "Hide low-priority again" : "Show all"}
                </Button>
              </div>
            ) : null}
          </div>
          <EmailDetail email={selectedEmail} />
        </div>
      </Card>
    </div>
  );
}
