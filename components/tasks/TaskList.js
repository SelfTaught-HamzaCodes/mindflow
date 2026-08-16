"use client";

import { AnimatePresence } from "framer-motion";
import { CheckSquare } from "lucide-react";
import TaskItem from "@/components/tasks/TaskItem";
import EmptyState from "@/components/ui/EmptyState";

export default function TaskList({
  tasks,
  onToggle,
  onInspect,
  highlightPriorities = false,
  emphasizeStyle = false,
}) {
  if (!tasks?.length) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks in this view"
        description="Adaptation or Priority Focus Mode may be hiding lower-priority work."
      />
    );
  }

  return (
    <ul className="space-y-3" aria-label="Tasks">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onInspect={onInspect}
            highlightPriorities={highlightPriorities}
            emphasizeStyle={emphasizeStyle}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
