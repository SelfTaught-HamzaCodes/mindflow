"use client";

import { Menu, Focus, PanelLeftClose, PanelLeft } from "lucide-react";
import { useWorkload } from "@/context/WorkloadContext";
import { usePrefs } from "@/context/PrefsContext";
import WorkloadBadge from "@/components/adaptive/WorkloadBadge";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import PreferencesMenu from "@/components/layout/PreferencesMenu";
import Button from "@/components/ui/Button";

export default function TopBar({
  onMenuClick,
  collapsed = false,
  onToggleCollapse,
}) {
  const { displayUser, firstName } = usePrefs();
  const { focusMode, toggleFocusMode } = useWorkload();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)]/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="hidden rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] lg:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        <p className="truncate text-sm text-[var(--text-primary)]">
          <span className="font-medium">{firstName}</span>
          <span className="hidden text-[var(--text-muted)] sm:inline">
            {" "}
            · {displayUser.role}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <WorkloadBadge />

        <Button
          variant={focusMode ? "primary" : "ghost"}
          size="sm"
          onClick={toggleFocusMode}
          aria-pressed={focusMode}
          aria-label={
            focusMode
              ? "Disable priority focus mode"
              : "Enable priority focus mode"
          }
          className={!focusMode ? "text-[var(--text-secondary)]" : undefined}
        >
          <Focus className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Focus</span>
        </Button>

        <div className="mx-0.5 hidden h-5 w-px bg-[var(--border)] sm:block" aria-hidden="true" />

        <NotificationPanel />
        <PreferencesMenu />
      </div>
    </header>
  );
}
