"use client";

import CalendarWidget from "@/components/dashboard/CalendarWidget";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

/**
 * Secondary dashboard region: calendar + activity feed.
 * Prefer composing these directly in DashboardView's 2×2 grid;
 * kept for reuse on other surfaces if needed.
 */
export default function SecondaryWidgets() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CalendarWidget />
      <ActivityFeed />
    </div>
  );
}
