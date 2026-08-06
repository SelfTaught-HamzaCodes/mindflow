"use client";

import { useState } from "react";
import { Coffee, Wind } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BreathingCircle from "@/components/adaptive/BreathingCircle";

/**
 * Focus Mode - Break Reminder (behavioural, not medical).
 * Always visible while Focus Mode is active.
 */
export default function BreakReminder({ onStartBreathing }) {
  const [guideOn, setGuideOn] = useState(false);

  return (
    <Card
      className="h-full border-sky-100 bg-gradient-to-br from-sky-50 to-white"
      aria-label="Break reminder"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
          <Coffee className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Break Reminder
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Behavioural reset · not a medical assessment
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        Focus Mode keeps only essential work visible. A short pause can help
        reduce information overload before you continue.
      </p>

      <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
        <li className="rounded-xl bg-white/80 px-3 py-2">
          Stand up and look away from the screen for 60 seconds
        </li>
        <li className="rounded-xl bg-white/80 px-3 py-2">
          Take 3 slow breaths before opening the next email
        </li>
        <li className="rounded-xl bg-white/80 px-3 py-2">
          Finish one priority task before checking new messages
        </li>
      </ul>

      <div className="mt-5">
        <BreathingCircle active={guideOn} showTiming={guideOn} />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          variant={guideOn ? "secondary" : "primary"}
          onClick={() => {
            setGuideOn((v) => !v);
            onStartBreathing?.();
          }}
        >
          <Wind className="h-4 w-4" aria-hidden="true" />
          {guideOn ? "Stop reset" : "Start 60-Second Reset"}
        </Button>
      </div>
    </Card>
  );
}
