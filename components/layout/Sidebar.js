"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  PenSquare,
  BarChart3,
  Sparkles,
  Sunset,
  X,
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { useWorkload } from "@/context/WorkloadContext";
import LogoMark from "@/components/layout/LogoMark";
import DemoControls from "@/components/adaptive/DemoControls";
import { logoFont } from "@/lib/logoFont";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox, badgeKey: "unreadEmailCount" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, badgeKey: "openTaskCount" },
  // Insights can disappear under High — requiresAnalytics gates that
  { href: "/analytics", label: "Insights", icon: BarChart3, requiresAnalytics: true },
  { href: "/compose", label: "Compose", icon: PenSquare },
  { href: "/reflection", label: "Reflection", icon: Sunset },
];

export default function Sidebar({
  open,
  onClose,
  collapsed = false,
}) {
  const pathname = usePathname();
  const data = useAppData();
  const { adaptation, level } = useWorkload();
  const collapseDesktop = collapsed;
  // Bigger badges under Elevated/High so priority spikes are harder to miss
  const emphasizeBadges = Boolean(adaptation.emphasizeBadges);
  const showRecommendation = Boolean(adaptation.showSidebarRecommendation);

  const visibleNav = NAV.filter(
    (item) => !item.requiresAnalytics || adaptation.showAnalytics,
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-svh w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-[width,transform] duration-300 ease-out lg:translate-x-0 ${
          collapseDesktop ? "lg:w-[4.5rem]" : "lg:w-64"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Main navigation"
        data-collapsed={collapseDesktop ? "true" : "false"}
      >
        <div
          className={`flex h-14 shrink-0 items-center px-5 ${
            collapseDesktop
              ? "justify-between lg:justify-center lg:gap-0 lg:px-2"
              : "justify-between"
          }`}
        >
          <Link
            href="/"
            className={`flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              collapseDesktop ? "lg:gap-0" : ""
            }`}
            onClick={onClose}
            title="Mindflow"
          >
            <LogoMark />
            <div className={collapseDesktop ? "lg:hidden" : undefined}>
              <p
                className={`${logoFont.className} text-sm font-semibold tracking-tight text-[var(--text-primary)]`}
              >
                Mindflow
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Research prototype
              </p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav
          className={`flex-1 space-y-1 overflow-y-auto py-4 ${
            collapseDesktop ? "px-3 lg:px-2" : "px-3"
          }`}
        >
          {visibleNav.map(({ href, label, icon: Icon, badgeKey }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            const badge = badgeKey ? data[badgeKey] : 0;

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  collapseDesktop
                    ? "justify-between lg:justify-center lg:px-0"
                    : "justify-between"
                } ${
                  active
                    ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span
                  className={`flex items-center gap-3 ${
                    collapseDesktop ? "lg:gap-0" : ""
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className={collapseDesktop ? "lg:hidden" : undefined}>
                    {label}
                  </span>
                </span>
                {badge > 0 ? (
                  <>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium shadow-sm ${
                        emphasizeBadges
                          ? "bg-[var(--accent)] text-white"
                          : "bg-white text-[var(--text-secondary)]"
                      } ${collapseDesktop ? "lg:hidden" : ""}`}
                    >
                      {badge}
                    </span>
                    {collapseDesktop ? (
                      <span
                        className="absolute right-2 top-2 hidden h-1.5 w-1.5 rounded-full bg-[var(--accent)] lg:block"
                        aria-hidden="true"
                      />
                    ) : null}
                  </>
                ) : null}
              </Link>
            );
          })}

          {showRecommendation && !collapseDesktop ? (
            <div className="mx-1 mt-4 rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-900">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Suggested Focus
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900/85">
                Finish today&apos;s highest-priority tasks before checking new
                email. Open Tasks for timed suggestions.
              </p>
              <Link
                href="/tasks"
                onClick={onClose}
                className="mt-2 inline-block text-[11px] font-medium text-amber-950 underline-offset-2 hover:underline"
              >
                View Suggested Focus
              </Link>
            </div>
          ) : null}
        </nav>

        <div
          className={`shrink-0 space-y-2 border-t border-[var(--border)] ${
            collapseDesktop ? "p-1.5" : "p-2.5"
          }`}
        >
          <div className="lg:hidden">
            <DemoControls />
          </div>
          <div className="hidden lg:block">
            <DemoControls collapsed={collapseDesktop} />
          </div>
          <p
            className={`text-[11px] leading-relaxed text-[var(--text-muted)] ${
              collapseDesktop ? "lg:hidden" : ""
            }`}
          >
            Interaction Design FYP · Sample data only · No real email
            connections
            {level === "high" ? " · Insights hidden" : ""}
          </p>
        </div>
      </aside>

      <div
        className={`hidden shrink-0 transition-[width] duration-300 ease-out lg:block ${
          collapseDesktop ? "w-[4.5rem]" : "w-64"
        }`}
        aria-hidden="true"
      />
    </>
  );
}
