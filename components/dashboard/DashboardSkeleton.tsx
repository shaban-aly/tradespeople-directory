/**
 * هيكل التحميل الهيكلي (Skeleton) للوحة تحكم الفني.
 * يطابق بدقة هندسة الترويسة الموحدة CraftsmanDashboardHeader والشبكة (8 أعمدة + 4 أعمدة)
 * ويمنع قفزات التخطيط (CLS) تماماً.
 * (عرض خالص — Server Component بدون "use client").
 */
export function DashboardSkeleton({
  variant = "overview",
}: {
  variant?: "overview" | "leads" | "profile";
}) {
  return (
    <div
      className="space-y-6 w-full animate-pulse"
      aria-busy="true"
      aria-label="جاري تحميل لوحة التحكم"
    >
      {/* 1. الترويسة الموحدة الهيكلية (CraftsmanDashboardHeader Skeleton) */}
      <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        {/* صف الهوية ومبدل الملفات */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* الصورة الشخصية */}
            <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl bg-muted/20 ring-1 ring-border/50" />

            {/* تفاصيل الاسم والتخصص */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-36 rounded-lg bg-muted/20" />
                <div className="h-5 w-16 rounded-full bg-muted/15" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 rounded-full bg-muted/15" />
                <div className="h-4 w-16 rounded-full bg-muted/10" />
                <div className="h-4 w-24 rounded-full bg-muted/15" />
              </div>
            </div>
          </div>

          {/* أدوات التحكم (مبدل الملفات وزر المعاينة والمشاركة) */}
          <div className="flex items-center gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border/40">
            <div className="h-9 flex-1 sm:w-28 rounded-xl bg-muted/20" />
            <div className="h-9 w-20 sm:w-24 shrink-0 rounded-xl bg-muted/15" />
            <div className="h-9 w-9 shrink-0 rounded-xl bg-muted/15" />
          </div>
        </div>

        {/* خط فاصل وشريط التبويبات الثلاثة المدمج */}
        <div className="border-t border-border/60 pt-1">
          <div className="grid grid-cols-3 gap-2 bg-muted/15 p-1.5 rounded-2xl">
            <div className="h-11 rounded-xl bg-muted/25" />
            <div className="h-11 rounded-xl bg-muted/15" />
            <div className="h-11 rounded-xl bg-muted/15" />
          </div>
        </div>
      </div>

      {/* 2. محتوى الصفحة حسب التبويب */}
      {variant === "overview" && (
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* العمود الرئيسي (8 أعمدة): الإحصائيات وسجل التفاعلات */}
          <div className="flex flex-col gap-6 lg:col-span-8 w-full">
            {/* مصفوفة الإحصائيات */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-16 rounded bg-muted/20" />
                    <div className="h-8 w-8 rounded-xl bg-muted/15" />
                  </div>
                  <div className="h-7 w-20 rounded bg-muted/25" />
                </div>
              ))}
            </div>

            {/* سجل تفاعلات الزبائن */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 rounded bg-muted/20" />
                <div className="h-8 w-44 rounded-xl bg-muted/15" />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-muted/20" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 rounded bg-muted/20" />
                        <div className="h-3 w-36 rounded bg-muted/15" />
                      </div>
                    </div>
                    <div className="h-4 w-16 rounded bg-muted/15" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* العمود الجانبي (4 أعمدة): جاهزية الملف والتقييمات */}
          <div className="flex flex-col gap-6 lg:col-span-4 w-full">
            {/* كارت جاهزية الملف */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="h-5 w-28 rounded bg-muted/20" />
              <div className="h-3 w-full rounded-full bg-muted/20" />
              <div className="space-y-2.5 pt-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-muted/20" />
                    <div className="h-4 w-40 rounded bg-muted/15" />
                  </div>
                ))}
              </div>
            </div>

            {/* كارت المراجعات */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3">
              <div className="h-5 w-24 rounded bg-muted/20" />
              <div className="h-10 w-32 rounded bg-muted/25" />
              <div className="h-16 w-full rounded-xl bg-muted/10" />
            </div>
          </div>
        </div>
      )}

      {variant === "leads" && (
        <div className="space-y-6">
          {/* مصفوفة مؤشرات العروض */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/80 bg-card p-4 text-center space-y-1.5"
              >
                <div className="h-7 w-12 mx-auto rounded bg-muted/25" />
                <div className="h-4 w-20 mx-auto rounded bg-muted/15" />
              </div>
            ))}
          </div>

          {/* قائمة كروت العروض */}
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3"
              >
                <div className="flex justify-between">
                  <div className="h-5 w-32 rounded bg-muted/20" />
                  <div className="h-5 w-20 rounded bg-muted/15" />
                </div>
                <div className="h-4 w-full rounded bg-muted/15" />
                <div className="h-4 w-2/3 rounded bg-muted/10" />
                <div className="h-10 w-36 rounded-xl bg-muted/25 pt-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "profile" && (
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          <div className="lg:col-span-4 w-full">
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
              <div className="aspect-4/3 w-full rounded-2xl bg-muted/20" />
              <div className="h-6 w-32 mx-auto rounded bg-muted/20" />
              <div className="h-11 w-full rounded-xl bg-muted/25" />
            </div>
          </div>
          <div className="lg:col-span-8 w-full">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
              <div className="h-6 w-44 rounded bg-muted/20" />
              <div className="h-12 w-full rounded-xl bg-muted/15" />
              <div className="h-12 w-full rounded-xl bg-muted/15" />
              <div className="h-28 w-full rounded-xl bg-muted/15" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
