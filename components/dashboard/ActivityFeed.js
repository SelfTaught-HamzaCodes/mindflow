"use client";

import {
  Activity,
  FileText,
  Mail,
  AtSign,
  Wallet,
  Megaphone,
  Sparkles,
  Inbox,
} from "lucide-react";
import activityData from "@/data/activity.json";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatRelativeDay, formatTime } from "@/lib/format";
import { alignActivity } from "@/lib/alignSampleDates";

const alignedActivity = alignActivity(activityData);

const TYPE_META = {
  request: { icon: Inbox, tone: "danger" },
  email: { icon: Mail, tone: "accent" },
  document: { icon: FileText, tone: "warning" },
  mention: { icon: AtSign, tone: "calm" },
  finance: { icon: Wallet, tone: "warning" },
  system: { icon: Megaphone, tone: "neutral" },
  social: { icon: Sparkles, tone: "neutral" },
};

/**
 * Presentation-only activity feed.
 * Shows realistic fake workplace collaboration events from local JSON.
 */
export default function ActivityFeed({
  items = alignedActivity,
  limit = 6,
}) {
  const visible = [...(items || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  return (
    <Card aria-label="Activity feed">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--text-secondary)]">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Activity feed
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Recent workplace activity · sample data
            </p>
          </div>
        </div>
        <Badge tone="neutral">{visible.length} updates</Badge>
      </div>

      <ul className="mt-5 space-y-1">
        {visible.map((item, index) => {
          const meta = TYPE_META[item.type] || TYPE_META.system;
          const Icon = meta.icon;
          const initials = item.actor
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("");

          return (
            <li key={item.id}>
              <div className="flex gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-[var(--surface-muted)]">
                <div className="relative">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent)]"
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  {index < visible.length - 1 ? (
                    <span
                      className="absolute left-1/2 top-10 h-[calc(100%-0.5rem)] w-px -translate-x-1/2 bg-[var(--border)]"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm text-[var(--text-primary)]">
                      <span className="font-medium">{item.actor}</span>{" "}
                      <span className="text-[var(--text-secondary)]">
                        {item.action}
                      </span>{" "}
                      <span className="font-medium">{item.target}</span>
                    </p>
                    <Badge tone={meta.tone} className="gap-1">
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {item.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {item.detail}
                  </p>
                  <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                    {item.actorRole} · {formatRelativeDay(item.createdAt)} ·{" "}
                    {formatTime(item.createdAt)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
