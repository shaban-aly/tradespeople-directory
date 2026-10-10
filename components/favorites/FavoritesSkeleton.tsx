/**
 * FavoritesGridSkeleton — هيكل تحميل متوافق مع شبكة كروت الصنايعية
 * يمنع الـ layout shift ووميض الشاشة الفارغة عند بداية التحميل والـ hydration
 */
export function FavoritesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="جاري تحميل المحفوظات..."
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={i}
          className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        >
          {/* صورة الكارت — نسبة 4:3 الثابتة */}
          <div className="relative aspect-4/3 animate-pulse bg-border/60">
            {/* شارة المنطقة المصغرة */}
            <div className="absolute bottom-2 right-2 h-5 w-16 rounded-full bg-background/80" />
            {/* زر النجمة بالزاوية */}
            <div className="absolute left-2 top-2 h-9 w-9 rounded-full bg-background/80" />
          </div>

          {/* محتوى الكارت */}
          <div className="flex flex-1 flex-col p-3 sm:p-3.5 space-y-2.5">
            {/* الاسم */}
            <div className="h-4.5 w-3/4 animate-pulse rounded-md bg-border" />
            {/* الشارات */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <div className="h-5 w-16 animate-pulse rounded-full bg-border/70" />
              <div className="h-5 w-12 animate-pulse rounded-full bg-border/70" />
            </div>
          </div>

          {/* أزرار الاتصال السريعة */}
          <div className="border-t border-border bg-background/40 p-2 sm:p-2.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-8 animate-pulse rounded-xl bg-border/80" />
              <div className="h-8 animate-pulse rounded-xl bg-border/80" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
