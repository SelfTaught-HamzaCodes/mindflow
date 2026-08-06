import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppDataProvider, useAppData } from "@/context/AppDataContext";

vi.mock("@/lib/supabase", () => ({
  persistTaskUpdate: vi.fn(async () => ({ ok: false, reason: "mocked" })),
  saveSessionNote: vi.fn(async () => ({ ok: false })),
  isSupabaseConfigured: false,
  supabase: null,
}));

function Probe() {
  const {
    user,
    emails,
    tasks,
    notifications,
    selectedEmail,
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
  } = useAppData();

  return (
    <div>
      <span data-testid="user">{user?.name}</span>
      <span data-testid="emails">{emails.length}</span>
      <span data-testid="tasks">{tasks.length}</span>
      <span data-testid="notifications">{notifications.length}</span>
      <span data-testid="unread-emails">{unreadEmailCount}</span>
      <span data-testid="open-tasks">{openTaskCount}</span>
      <span data-testid="unread-notes">{unreadNotificationCount}</span>
      <span data-testid="selected">{selectedEmail?.id || ""}</span>
      <button
        type="button"
        onClick={() => {
          const unread = emails.find((e) => e.unread);
          if (unread) selectEmail(unread.id);
        }}
      >
        Select Unread
      </button>
      <button
        type="button"
        onClick={() => {
          const open = tasks.find((t) => t.status !== "done");
          if (open) toggleTaskStatus(open.id);
        }}
      >
        Toggle Task
      </button>
      <button
        type="button"
        onClick={() => {
          const unread = notifications.find((n) => !n.read);
          if (unread) markNotificationRead(unread.id);
        }}
      >
        Mark Note Read
      </button>
      <button type="button" onClick={() => markAllNotificationsRead()}>
        Mark All Read
      </button>
      <button type="button" onClick={() => injectUrgentEmail()}>
        Inject Email
      </button>
      <button type="button" onClick={() => injectHighPriorityTask()}>
        Inject Task
      </button>
      <button type="button" onClick={() => injectNotifications(3)}>
        Inject Notes
      </button>
      <button
        type="button"
        onClick={() => {
          const unread = emails.find((e) => e.unread);
          if (unread) markEmailRead(unread.id);
        }}
      >
        Mark Email Read
      </button>
    </div>
  );
}

describe("AppDataContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when useAppData is used outside the provider", () => {
    expect(() => render(<Probe />)).toThrow(
      /useAppData must be used within AppDataProvider/,
    );
  });

  it("loads sample emails, tasks, notifications, and demo user", () => {
    render(
      <AppDataProvider>
        <Probe />
      </AppDataProvider>,
    );
    expect(screen.getByTestId("user").textContent).toMatch(/Alex/i);
    expect(Number(screen.getByTestId("emails").textContent)).toBeGreaterThan(0);
    expect(Number(screen.getByTestId("tasks").textContent)).toBeGreaterThan(0);
    expect(Number(screen.getByTestId("notifications").textContent)).toBeGreaterThan(
      0,
    );
  });

  it("selectEmail marks the email read and updates selection", async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <Probe />
      </AppDataProvider>,
    );
    const before = Number(screen.getByTestId("unread-emails").textContent);
    await user.click(screen.getByRole("button", { name: "Select Unread" }));
    expect(screen.getByTestId("selected").textContent.length).toBeGreaterThan(0);
    expect(Number(screen.getByTestId("unread-emails").textContent)).toBe(
      Math.max(0, before - 1),
    );
  });

  it("toggleTaskStatus flips open/done and updates openTaskCount", async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <Probe />
      </AppDataProvider>,
    );
    const before = Number(screen.getByTestId("open-tasks").textContent);
    await user.click(screen.getByRole("button", { name: "Toggle Task" }));
    expect(Number(screen.getByTestId("open-tasks").textContent)).toBe(
      before - 1,
    );
  });

  it("markNotificationRead and markAllNotificationsRead update unread counts", async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <Probe />
      </AppDataProvider>,
    );
    const before = Number(screen.getByTestId("unread-notes").textContent);
    await user.click(screen.getByRole("button", { name: "Mark Note Read" }));
    expect(Number(screen.getByTestId("unread-notes").textContent)).toBe(
      before - 1,
    );
    await user.click(screen.getByRole("button", { name: "Mark All Read" }));
    expect(screen.getByTestId("unread-notes").textContent).toBe("0");
  });

  it("demo injectors add sample email, task, and notifications", async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <Probe />
      </AppDataProvider>,
    );
    const emailsBefore = Number(screen.getByTestId("emails").textContent);
    const tasksBefore = Number(screen.getByTestId("tasks").textContent);
    const notesBefore = Number(screen.getByTestId("notifications").textContent);

    await user.click(screen.getByRole("button", { name: "Inject Email" }));
    await user.click(screen.getByRole("button", { name: "Inject Task" }));
    await user.click(screen.getByRole("button", { name: "Inject Notes" }));

    expect(Number(screen.getByTestId("emails").textContent)).toBe(emailsBefore + 1);
    expect(Number(screen.getByTestId("tasks").textContent)).toBe(tasksBefore + 1);
    expect(Number(screen.getByTestId("notifications").textContent)).toBe(
      notesBefore + 3,
    );
  });
});
