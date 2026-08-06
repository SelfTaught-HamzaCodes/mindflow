"use client";

import { useWorkload } from "@/context/WorkloadContext";
import { WORKLOAD_LEVELS, WORKLOAD_LABELS } from "@/lib/constants";

/**
 * Examiner / demo control to force Estimated Workload levels
 * without needing to reproduce typing patterns live.
 */
export default function DemoWorkloadToggle() {
  const { forcedLevel, setForcedLevel, liveLevel } = useWorkload();

  const options = [
    { value: "", label: "Live" },
    { value: WORKLOAD_LEVELS.CALM, label: WORKLOAD_LABELS.calm },
    { value: WORKLOAD_LEVELS.NEUTRAL, label: WORKLOAD_LABELS.neutral },
    { value: WORKLOAD_LEVELS.HIGH, label: WORKLOAD_LABELS.high },
  ];

  return (
    <select
      aria-label="Demo override for estimated workload"
      className="h-7 max-w-[8.5rem] truncate rounded-lg border-0 bg-transparent px-2 text-xs text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      value={forcedLevel || ""}
      onChange={(e) => setForcedLevel(e.target.value || null)}
      title="Demo override"
    >
      {options.map((opt) => (
        <option key={opt.label} value={opt.value}>
          {opt.value === ""
            ? `Live (${WORKLOAD_LABELS[liveLevel]})`
            : opt.label}
        </option>
      ))}
    </select>
  );
}
