/**
 * NotificationsSkeleton — هيكل تحميل متوافق مع قائمة الإشعارات
 * يمنع الـ layout shift والشاشة البيضاء عند فتح صفحة الإشعارات
 */
export function NotificationsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="جاري تحميل الإشعارات..."
      className="space-y-4"
    >
      {/* شريط الأدوات والفلاتر */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded-full bg-border/80" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-border/60" />
        </div>
        <div className="h-5 w-32 animate-pulse rounded-md bg-border/70" />
      </div>

      {/* قائمة كروت الإشعارات */}
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-start gap-3.5 px-4 py-4">
            {/* أيقونة دائرية */}
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-border/80" />

            {/* تفاصيل الإشعار */}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="h-4.5 w-44 max-w-[65%] animate-pulse rounded-md bg-border" />
                <div className="h-3.5 w-16 animate-pulse rounded-md bg-border/70" />
              </div>
              <div className="h-4 w-5/6 animate-pulse rounded-md bg-border/60" />
            </div>

            {/* مؤشر غير مقروء */}
            <div className="mt-2 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-border/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
