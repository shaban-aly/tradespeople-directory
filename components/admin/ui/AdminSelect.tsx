import type { SelectHTMLAttributes } from "react";

/**
 * الـ select الموحّد للوحة تحكّم المشرف — نفس حدود الإدخالات القوية (border-border-strong).
 */

type AdminSelectProps = {
  className?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function AdminSelect({ className = "", ...props }: AdminSelectProps) {
  return (
    <select
      className={`w-full rounded-xl border border-border-strong bg-card px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none ${className}`}
      {...props}
    />
  );
}