import type { ReactNode } from "react";

/**
 * هيكل كارت السجل الموحّد لأقسام الطلبات/البلاغات/الرسائل:
 * badge (شارة الحالة) + title (عنوان غامق) + meta (تاريخ...) ثم body ثم actions.
 */
export function RecordCard({
  badge,
  title,
  meta,
  body,
  actions,
}: {
  badge?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  body: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="grid gap-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {badge}
          <span className="text-base font-bold text-foreground">{title}</span>
        </div>
        {meta && <span className="text-base text-muted">{meta}</span>}
      </div>
      {body}
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </article>
  );
}