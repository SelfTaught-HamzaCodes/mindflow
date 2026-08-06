"use client";

import { usePathname } from "next/navigation";
import { Focus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorkload } from "@/context/WorkloadContext";
import Button from "@/components/ui/Button";

/**
 * Compact Focus banner for non-dashboard routes.
 * Dashboard uses FocusModeView instead (Priority Inbox / Tasks / Break Reminder).
 */
export default function FocusBanner() {
  const pathname = usePathname();
  const { focusMode, setFocusMode } = useWorkload();
  const show = focusMode && pathname !== "/";

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
              <Focus className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-sky-950">
                Focus Mode Activated
              </p>
              <p className="text-xs text-sky-800/80">
                Estimated cognitive load increased based on recent interaction
                behaviour. Lists show today&apos;s important items only. Open
                Dashboard for the full Focus workspace.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFocusMode(false)}
            aria-label="Exit priority focus mode"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Exit focus
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
