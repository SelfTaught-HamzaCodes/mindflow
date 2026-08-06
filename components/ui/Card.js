/**
 * Surface card with soft shadow - used for dashboard widgets and panels.
 */
export default function Card({
  children,
  className = "",
  padding = true,
  as: Tag = "div",
  ...props
}) {
  return (
    <Tag
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] ${
        padding ? "p-5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
