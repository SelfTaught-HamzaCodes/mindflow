"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useSpring,
} from "framer-motion";

/**
 * Smoothly ticks a numeric display between values (Compose Interaction Analysis).
 */
export default function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  className = "",
}) {
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  const motionValue = useMotionValue(target);
  const spring = useSpring(motionValue, {
    stiffness: 280,
    damping: 34,
    mass: 0.5,
  });
  const controls = useAnimationControls();
  const [display, setDisplay] = useState(() => format(target, decimals));
  const prevRef = useRef(target);

  useEffect(() => {
    motionValue.set(target);
    if (prevRef.current !== target) {
      prevRef.current = target;
      controls.start({
        scale: [1, 1.1, 1],
        y: [0, -2, 0],
        transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
      });
    }
  }, [target, motionValue, controls]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      setDisplay(format(latest, decimals));
    });
  }, [spring, decimals]);

  return (
    <motion.span
      className={`relative inline-flex items-baseline tabular-nums text-[var(--text-primary)] ${className}`}
      animate={controls}
      initial={false}
    >
      <motion.span
        key={`glow-${target}`}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-1 -inset-y-0.5 rounded-md bg-[var(--accent-soft)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      <span className="relative">{display}</span>
      {suffix ? (
        <span className="relative ml-0.5 text-[0.85em] font-medium text-[var(--text-muted)]">
          {suffix}
        </span>
      ) : null}
    </motion.span>
  );
}

/**
 * Crossfade for non-numeric labels (e.g. Confidence).
 */
export function AnimatedMetricLabel({ value, className = "" }) {
  return (
    <span
      className={`relative inline-flex h-[1.25em] min-w-[5ch] items-center justify-end overflow-hidden ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{
            opacity: 0,
            y: -10,
            filter: "blur(4px)",
            position: "absolute",
          }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function format(n, decimals) {
  if (decimals > 0) return Number(n).toFixed(decimals);
  return String(Math.round(n));
}
