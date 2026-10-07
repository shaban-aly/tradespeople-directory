import type { ReactNode } from "react";

/**
 * غلاف المجموعة الموحّد لصفحة الحساب: عنوان صغير + كارت مقسّم صفوف.
 * (عرض خالص — بدون "use client").
 */
export function ProfileGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-muted">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="divide-y divide-border/60">{children}</div>
      </div>
    </div>
  );
}
