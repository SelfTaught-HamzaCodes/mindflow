"use client";

import { AppDataProvider } from "@/context/AppDataContext";
import { PrefsProvider, usePrefs } from "@/context/PrefsContext";
import { WorkloadProvider } from "@/context/WorkloadContext";
import AppShell from "@/components/layout/AppShell";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import LogoMark from "@/components/layout/LogoMark";

/**
 * Client provider tree.
 * AppData → Prefs → Workload so adaptation can read sample data and
 * first-visit answers without a circular import mess.
 */
export default function AppProviders({ children }) {
  return (
    <AppDataProvider>
      <PrefsProvider>
        <WorkloadProvider>
          <OnboardingGate>{children}</OnboardingGate>
        </WorkloadProvider>
      </PrefsProvider>
    </AppDataProvider>
  );
}

function OnboardingGate({ children }) {
  const { ready, prefs } = usePrefs();

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--background)]">
        <LogoMark />
        <span className="sr-only">Loading Mindflow</span>
      </div>
    );
  }

  if (!prefs.onboarded) {
    return <OnboardingFlow mode="first-visit" />;
  }

  return <AppShell>{children}</AppShell>;
}
