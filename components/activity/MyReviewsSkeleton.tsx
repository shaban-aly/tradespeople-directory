/**
 * هيكل التحميل الهيكلي (Skeleton) لصفحة تقييماتي ومراجعاتي.
 * يمنع قفزات التخطيط ويحاكي بطاقات التقييم بدقة.
 * (عرض خالص — Server Component بدون "use client").
 */
export function MyReviewsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10 space-y-6" aria-busy="true" aria-label="جاري تحميل التقييمات">
      {/* سطر العنوان الهيكلي */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-8 w-44 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-4 w-72 rounded-md bg-muted/15 animate-pulse" />
        </div>
        <div className="h-9 w-24 rounded-xl border border-border/60 bg-card animate-pulse" />
      </div>

      {/* الحاوية الرئيسية للتقييمات */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-36 rounded-lg bg-muted/20 animate-pulse" />
              <div className="h-5 w-8 rounded-full bg-muted/15 animate-pulse" />
            </div>
            <div className="h-4 w-60 rounded-md bg-muted/10 animate-pulse" />
          </div>
        </div>

        {/* بطاقات التقييمات الهيكلية */}
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/80 bg-background/50 p-5 space-y-3"
            >
              {/* الرأس: الصورة والاسم والتقييم */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-muted/20 animate-pulse shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded-md bg-muted/20 animate-pulse" />
                    <div className="h-3 w-16 rounded-md bg-muted/15 animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-24 rounded-md bg-muted/20 animate-pulse shrink-0" />
              </div>

              {/* نص التقييم */}
              <div className="space-y-1.5 pt-1">
                <div className="h-3.5 w-full rounded-md bg-muted/15 animate-pulse" />
                <div className="h-3.5 w-3/4 rounded-md bg-muted/10 animate-pulse" />
              </div>

              {/* أسفل الكارت: التاريخ وأزرار الإجراء */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="h-3 w-20 rounded-md bg-muted/10 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-7 w-14 rounded-lg bg-muted/15 animate-pulse" />
                  <div className="h-7 w-14 rounded-lg bg-muted/15 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
