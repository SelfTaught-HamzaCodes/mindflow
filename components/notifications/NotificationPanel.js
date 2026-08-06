"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Bell, Clock3 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppData } from "@/context/AppDataContext";
import { useWorkload } from "@/context/WorkloadContext";
import {
  classifyNotifications,
  PRIORITY_LABELS,
  NORMAL_DELAY_MS,
} from "@/lib/notificationFilter";
import { formatTime } from "@/lib/format";
import Badge from "@/components/ui/Badge";

function priorityTone(priority) {
  if (priority === "priority") return "danger";
  if (priority === "normal") return "warning";
  return "neutral";
}

function formatRemaining(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

/**
 * Notification bell + panel.
 * Visible list is filtered by Estimated Workload — under High you mostly
 * see Priority, while normals sit in a "delayed" bucket untill release.
 * Showing the countdown makes the adaptation observable for the RQ.
 */
export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const panelId = useId();
  const rootRef = useRef(null);
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    useAppData();
  const { level, focusMode, highLoadStartedAt, adaptation, demoSpeed } =
    useWorkload();
  const emphasizeBadges = Boolean(adaptation?.emphasizeBadges);
  // Wall delay shrinks with demo speed so examiners arent waiting 45s
  const wallDelayMs = NORMAL_DELAY_MS / Math.max(1, demoSpeed || 1);

  // Tick while panel open or while normals may still be delayed
  useEffect(() => {
    const shouldTick =
      open ||
      (highLoadStartedAt != null &&
        Date.now() - highLoadStartedAt < wallDelayMs);
    if (!shouldTick) return undefined;

    const id = setInterval(
      () => setNow(Date.now()),
      demoSpeed > 1 ? 250 : 1000,
    );
    return () => clearInterval(id);
  }, [open, highLoadStartedAt, wallDelayMs, demoSpeed]);

  const { visible, delayed, policy } = useMemo(
    () =>
      classifyNotifications(notifications, level, {
        focusMode,
        highLoadStartedAt,
        now,
        demoSpeed,
      }),
    [notifications, level, focusMode, highLoadStartedAt, now, demoSpeed],
  );

  const unreadVisible = visible.filter((n) => !n.read).length;

  useEffect(() => {
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-label={`Notifications${unreadVisible ? `, ${unreadVisible} unread` : ""}${
          delayed.length ? `, ${delayed.length} delayed` : ""
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className={emphasizeBadges ? "h-5 w-5 text-[var(--accent)]" : "h-5 w-5"} />
        {unreadVisible > 0 ? (
          <span
            className={`absolute rounded-full bg-[var(--accent)] ${
              emphasizeBadges
                ? "right-1 top-1 h-2.5 w-2.5 ring-2 ring-white"
                : "right-1.5 top-1.5 h-2 w-2"
            }`}
          />
        ) : delayed.length > 0 ? (
          <span
            className={`absolute rounded-full bg-amber-400 ${
              emphasizeBadges
                ? "right-1 top-1 h-2.5 w-2.5 ring-2 ring-white"
                : "right-1.5 top-1.5 h-2 w-2"
            }`}
          />
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-label="Notifications"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Notifications
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {policy.rules}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-[var(--accent)] hover:underline"
                onClick={markAllNotificationsRead}
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <ul>
                {visible.length === 0 && delayed.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
                    No notifications for the current behaviour estimate.
                  </li>
                ) : (
                  visible.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={`flex w-full flex-col gap-1 border-b border-[var(--border)] px-4 py-3 text-left hover:bg-[var(--surface-muted)] ${
                          n.read ? "opacity-70" : ""
                        }`}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {n.title}
                          </span>
                          <Badge tone={priorityTone(n.priority)}>
                            {PRIORITY_LABELS[n.priority] || n.priority}
                          </Badge>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {n.message}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {formatTime(n.createdAt)}
                          {n.wasDelayed ? " · Released after delay" : ""}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>

              {delayed.length > 0 ? (
                <div className="border-t border-[var(--border)] bg-amber-50/60 px-4 py-3">
                  <div className="mb-2 flex items-center gap-2 text-amber-900">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    <p className="text-xs font-medium">
                      Delayed · Normal priority ({delayed.length})
                    </p>
                  </div>
                  <p className="mb-3 text-[11px] leading-relaxed text-amber-900/80">
                    When Workspace Status is High, normal notifications are held for{" "}
                    {Math.round(wallDelayMs / 1000)}s
                    {demoSpeed > 1 ? ` (demo ×${demoSpeed})` : ""} to reduce
                    distraction. Priority stays visible; low stays hidden.
                  </p>
                  <ul className="space-y-2">
                    {delayed.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-xl border border-amber-100 bg-white/80 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                            {n.title}
                          </p>
                          <Badge tone="warning">
                            {formatRemaining(n.remainingMs)}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                          {n.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
