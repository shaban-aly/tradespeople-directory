import type { SelectHTMLAttributes } from "react";

const selectClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function SelectField({
  invalid,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`${selectClass}${invalid ? " border-danger" : ""} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
