"use client";

import { Activity } from "lucide-react";
import { WORKLOAD_LABELS, WORKSPACE_STATUS_TITLE } from "@/lib/constants";
import { useWorkload } from "@/context/WorkloadContext";
import Badge from "@/components/ui/Badge";

/**
 * Compact Workspace Status indicator for the top bar.
 */
export default function WorkloadBadge() {
  const { level, confidence, isDemoOverride, insufficientData } = useWorkload();

  const tone =
    level === "calm" ? "calm" : level === "high" ? "high" : "warning";

  const statusHint = isDemoOverride
    ? "Demo override"
    : insufficientData
      ? "Collecting interaction data"
      : `${Math.round(confidence * 100)}% confidence`;

  return (
    <Badge
      tone={tone}
      className="gap-1 border border-transparent bg-white/80"
      title={`${WORKSPACE_STATUS_TITLE}: ${WORKLOAD_LABELS[level]} (${statusHint})`}
    >
      <Activity className="h-3 w-3" aria-hidden="true" />
      <span>{WORKLOAD_LABELS[level]}</span>
      <span className="sr-only">
        {WORKSPACE_STATUS_TITLE}. {statusHint}.
      </span>
    </Badge>
  );
}
