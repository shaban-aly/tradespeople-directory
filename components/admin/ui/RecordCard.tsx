import type { ReactNode } from "react";

/**
 * هيكل كارت السجل الموحّد لأقسام الطلبات/البلاغات/الرسائل:
 * badge (شارة الحالة) + title (عنوان غامق) + meta (تاريخ...) ثم body ثم actions.
 * `onOpen` (اختياري): الضغط على جسم الكارت يفتح التفاصيل — نقرات الأزرار
 * الداخلية لا تُمرَّر (stopPropagation) حتى لا يفتح الدراور بالخطأ.
 */
export function RecordCard({
  badge,
  title,
  meta,
  body,
  actions,
  onOpen,
}: {
  badge?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  body: ReactNode;
  actions?: ReactNode;
  onOpen?: () => void;
}) {
  return (
    <article
      className={`grid gap-4 rounded-xl border border-border p-4 ${onOpen ? "cursor-pointer transition-colors hover:border-accent/50" : ""}`}
      {...(onOpen
        ? {
            onClick: onOpen,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen();
              }
            },
            role: "button",
            tabIndex: 0,
          }
        : {})}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {badge}
          <span className="text-base font-bold text-foreground">{title}</span>
        </div>
        {meta && <span className="text-base text-muted">{meta}</span>}
      </div>
      {body}
      {actions && (
        <div
          className="flex flex-wrap items-center gap-3"
          onClick={onOpen ? (event) => event.stopPropagation() : undefined}
          onKeyDown={onOpen ? (event) => event.stopPropagation() : undefined}
        >
          {actions}
        </div>
      )}
    </article>
  );
}