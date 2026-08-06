/**
 * Accessible empty-state placeholder for filtered lists.
 */
export default function EmptyState({
  title = "Nothing to show",
  description,
  icon: Icon,
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6"
      role="status"
    >
      {Icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--text-muted)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      ) : null}
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
