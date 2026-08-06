/**
 * Compact status / priority badge.
 */
export default function Badge({
  children,
  tone = "neutral",
  className = "",
  ...props
}) {
  const tones = {
    neutral: "bg-[var(--surface-muted)] text-[var(--text-secondary)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-700",
    calm: "bg-sky-50 text-sky-700",
    high: "bg-orange-50 text-orange-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${
        tones[tone] || tones.neutral
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
