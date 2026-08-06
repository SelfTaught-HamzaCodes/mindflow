"use client";

import { AppDataProvider } from "@/context/AppDataContext";
import { WorkloadProvider } from "@/context/WorkloadContext";
import AppShell from "@/components/layout/AppShell";

/**
 * Client provider tree.
 * AppData (sample content) wraps Workload (behaviour estimate) so adaptation
 * can read emails/tasks without a circular import mess.
 */
export default function AppProviders({ children }) {
  return (
    <AppDataProvider>
      <WorkloadProvider>
        <AppShell>{children}</AppShell>
      </WorkloadProvider>
    </AppDataProvider>
  );
}
