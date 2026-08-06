"use client";

/**
 * Shared inbox / tasks / notifications for the prototype.
 * Kept seperate from WorkloadContext on purpose — adaptation logic shouldn't
 * own the sample data, otherwise demos get messy when we inject fake emails.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import emailsData from "@/data/emails.json";
import tasksData from "@/data/tasks.json";
import notificationsData from "@/data/notifications.json";
import userData from "@/data/user.json";
import { persistTaskUpdate } from "@/lib/supabase";
import {
  alignEmails,
  alignNotifications,
  alignTasks,
} from "@/lib/alignSampleDates";

const AppDataContext = createContext(null);

// Shift authored "scenario today" so demos always feel like "today" no matter
// which calendar day the viva happens on.
const initialEmails = alignEmails(emailsData);
const initialTasks = alignTasks(tasksData);
const initialNotifications = alignNotifications(notificationsData);

let demoSeq = 0;
function nextDemoId(prefix) {
  demoSeq += 1;
  // timestamp + seq so rapid injects dont collide (happened once in a practice run)
  return `${prefix}-demo-${Date.now()}-${demoSeq}`;
}

function todayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AppDataProvider({ children }) {
  const [emails, setEmails] = useState(initialEmails);
  const [tasks, setTasks] = useState(initialTasks);
  const [notifications, setNotifications] = useState(initialNotifications);
  // Prefer an unread mail so the inbox doesn't look "done" on first paint
  const [selectedEmailId, setSelectedEmailId] = useState(
    initialEmails.find((e) => e.unread)?.id || initialEmails[0]?.id || null,
  );

  const markEmailRead = useCallback((id) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, unread: false } : e)),
    );
  }, []);

  const selectEmail = useCallback(
    (id) => {
      setSelectedEmailId(id);
      // Opening a thread implies "I've seen it" — matches how real clients behave
      markEmailRead(id);
    },
    [markEmailRead],
  );

  const toggleTaskStatus = useCallback(async (id) => {
    let updated = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus = t.status === "done" ? "todo" : "done";
        updated = { ...t, status: nextStatus };
        return updated;
      }),
    );
    if (updated) {
      // Best-effort only — local UI shouldnt freeze if Supabase isn't wired up
      await persistTaskUpdate(updated);
    }
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  /**
   * Prototype-only injectors for viva demos.
   * These are sample rows, not live mail — examiners can force a priority spike
   * without waiting for real typing metrics to climb.
   */
  const injectUrgentEmail = useCallback(() => {
    const id = nextDemoId("e");
    const now = new Date().toISOString();
    setEmails((prev) => [
      {
        id,
        from: "Demo Sender",
        fromEmail: "demo@northwind.co",
        subject: "Urgent: client escalation needs reply today",
        preview: "Injected sample email for research prototype demos.",
        body: "Hi Alex,\n\nThis is an injected urgent sample email for the research prototype. It is not a real message.\n\nThanks,\nDemo Sender",
        priority: "high",
        unread: true,
        today: true,
        important: true,
        receivedAt: now,
        folder: "inbox",
      },
      ...prev,
    ]);
  }, []);

  const injectHighPriorityTask = useCallback(() => {
    const id = nextDemoId("t");
    setTasks((prev) => [
      {
        id,
        title: "Respond to injected priority follow-up",
        description:
          "Sample high-priority task added from Demo controls (prototype only).",
        priority: "high",
        status: "todo",
        // due today so Focus Mode (today + important) will pick it up
        dueDate: todayDateString(),
        today: true,
        important: true,
        category: "Demo",
        effortMinutes: 15,
        meetingRelated: false,
      },
      ...prev,
    ]);
  }, []);

  const injectNotifications = useCallback((count = 5) => {
    // Cap at 20 — dumping hundreds just makes the panel unusable in a demo
    const n = Math.max(1, Math.min(20, Number(count) || 5));
    const now = Date.now();
    const batch = Array.from({ length: n }, (_, i) => {
      // Mix priorities so High-load filtering is actually visible
      const priorities = ["priority", "normal", "normal", "low", "priority"];
      const priority = priorities[i % priorities.length];
      return {
        id: nextDemoId("n"),
        title:
          priority === "priority"
            ? `Priority alert ${i + 1}`
            : priority === "low"
              ? `Low priority note ${i + 1}`
              : `Normal update ${i + 1}`,
        message: "Injected sample notification for prototype demos.",
        priority,
        type: "demo",
        // stagger by 1s so sort order is deterministic-ish
        createdAt: new Date(now - i * 1000).toISOString(),
        read: false,
      };
    });
    setNotifications((prev) => [...batch, ...prev]);
  }, []);

  // Badge counts for the sidebar — cheap derived state, no need to store
  const unreadEmailCount = useMemo(
    () => emails.filter((e) => e.unread).length,
    [emails],
  );

  const openTaskCount = useMemo(
    () => tasks.filter((t) => t.status !== "done").length,
    [tasks],
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedEmailId) || null,
    [emails, selectedEmailId],
  );

  // Memo the bag so consumers dont re-render on every parent paint
  const value = useMemo(
    () => ({
      user: userData,
      emails,
      tasks,
      notifications,
      selectedEmail,
      selectedEmailId,
      selectEmail,
      markEmailRead,
      toggleTaskStatus,
      markNotificationRead,
      markAllNotificationsRead,
      injectUrgentEmail,
      injectHighPriorityTask,
      injectNotifications,
      unreadEmailCount,
      openTaskCount,
      unreadNotificationCount,
    }),
    [
      emails,
      tasks,
      notifications,
      selectedEmail,
      selectedEmailId,
      selectEmail,
      markEmailRead,
      toggleTaskStatus,
      markNotificationRead,
      markAllNotificationsRead,
      injectUrgentEmail,
      injectHighPriorityTask,
      injectNotifications,
      unreadEmailCount,
      openTaskCount,
      unreadNotificationCount,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}
