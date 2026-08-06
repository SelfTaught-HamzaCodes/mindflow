"use client";

import { CalendarDays, MapPin, Users } from "lucide-react";
import calendarData from "@/data/calendar.json";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatRelativeDay, formatTime } from "@/lib/format";
import { alignCalendarEvents } from "@/lib/alignSampleDates";

const alignedCalendar = alignCalendarEvents(calendarData);

/**
 * Presentation-only calendar widget.
 * Renders realistic fake business events from local JSON - no backend.
 * Dates are shifted so the sample "today" matches the real calendar day.
 */
export default function CalendarWidget({
  events = alignedCalendar,
  todayOnly = true,
  limit = 4,
}) {
  const visible = (events || [])
    .filter((e) => (todayOnly ? e.today : true))
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, limit);

  return (
    <Card aria-label="Calendar">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Calendar
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {todayOnly ? "Today's schedule · sample data" : "Upcoming · sample data"}
            </p>
          </div>
        </div>
        <Badge tone="accent">{visible.length} events</Badge>
      </div>

      <ol className="mt-5 space-y-3">
        {visible.map((event) => (
          <li
            key={event.id}
            className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-14 shrink-0 pt-0.5 text-center">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {formatTime(event.start)}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {formatTime(event.end)}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {event.title}
                  </p>
                  <Badge
                    tone={
                      event.priority === "high"
                        ? "danger"
                        : event.priority === "medium"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {event.type}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                  {event.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {event.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {event.attendees?.length || 0}
                  </span>
                  {!event.today ? (
                    <span>{formatRelativeDay(event.start)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
