/**
 * هيكل التحميل الهيكلي (Skeleton) لصفحة سجل نشاطاتي.
 * يمنع قفزات التخطيط ويحاكي كروت الأنشطة بدقة.
 * (عرض خالص — Server Component بدون "use client").
 */
export function ActivitySkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6" aria-busy="true" aria-label="جاري تحميل سجل النشاطات">
      {/* سطر العنوان الهيكلي */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1.5">
          <div className="h-8 w-40 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-4 w-64 rounded-md bg-muted/15 animate-pulse" />
        </div>
        <div className="h-9 w-20 rounded-xl border border-border/60 bg-card animate-pulse" />
      </div>

      {/* كروت الأنشطة الهيكلية */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-muted/20 animate-pulse shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded-md bg-muted/20 animate-pulse" />
                <div className="h-3 w-56 rounded-md bg-muted/15 animate-pulse" />
              </div>
            </div>
            <div className="h-5 w-5 rounded-md bg-muted/15 animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
