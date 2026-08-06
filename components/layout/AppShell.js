"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import WellnessPrompt from "@/components/adaptive/WellnessPrompt";
import FocusBanner from "@/components/adaptive/FocusBanner";
import FocusActivationOverlay from "@/components/focus/FocusActivationOverlay";
import { useWorkload } from "@/context/WorkloadContext";

/**
 * App chrome: sidebar + top bar + main content.
 * Whitespace / max-width bump under High so the page feels less cramped —
 * subtle but examiners noticed it in pilots.
 */
export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { adaptation } = useWorkload();

  // High / Focus prefer a slim rail; user can expand again if they want
  useEffect(() => {
    if (adaptation.collapseSidebar) setSidebarCollapsed(true);
  }, [adaptation.collapseSidebar]);

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((prev) => !prev);
  }

  return (
    <div className="flex min-h-full bg-[var(--background)]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
        <main
          className={`flex-1 ${
            adaptation.increaseWhitespace
              ? "px-5 py-8 sm:px-10 sm:py-10"
              : "px-4 py-6 sm:px-6 sm:py-8"
          }`}
        >
          <div
            className={`mx-auto w-full ${
              adaptation.increaseWhitespace ? "max-w-5xl" : "max-w-6xl"
            }`}
          >
            <FocusBanner />
            {children}
          </div>
        </main>
      </div>
      <WellnessPrompt />
      <FocusActivationOverlay />
    </div>
  );
}
