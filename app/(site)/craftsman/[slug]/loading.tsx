/** Skeleton مطابق لصفحة /craftsman/[slug]
 *  الصفحة الحقيقية (CraftsmanDetail):
 *    1) breadcrumb nav
 *    2) بطاقة رئيسية: صورة hero + اسم + شارات + أزرار اتصال (desktop)
 *    3) قسم "عن الصنايعي"
 *    4) قسم التقييمات
 *    5) شريط الاتصال السفلي الثابت (mobile)
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="جاري التحميل"
      className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4"
    >
      <div className="flex flex-col gap-6">

        {/* ── 1. Breadcrumb ── */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded-md bg-card border border-border" />
          <div className="h-3 w-1 animate-pulse rounded-full bg-border" />
          <div className="h-4 w-20 animate-pulse rounded-md bg-card border border-border" />
          <div className="h-3 w-1 animate-pulse rounded-full bg-border" />
          <div className="h-4 w-28 animate-pulse rounded-md bg-card border border-border" />
        </div>

        {/* ── 2. البطاقة الرئيسية ── */}
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          {/* Hero image area */}
          <div className="relative flex h-64 sm:h-72 md:h-80 w-full items-center justify-center overflow-hidden bg-card">
            <div className="absolute inset-0 animate-pulse bg-border opacity-60" />
          </div>

          {/* Name in center */}
          <div className="flex flex-col items-center justify-center px-6 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-44 animate-pulse rounded-xl bg-border" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-accent/20" />
            </div>
          </div>

          {/* Info footer */}
          <div className="border-t border-border bg-background/50 px-5 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3">
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-border" />
                <div className="h-6 w-24 animate-pulse rounded-full bg-border" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-16 animate-pulse rounded-full bg-border" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-border" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. "عن الصنايعي" section ── */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          {/* Section title */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded-full bg-border" />
            <div className="h-5 w-36 animate-pulse rounded-md bg-border" />
          </div>
          {/* Description lines */}
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-md bg-border" />
            <div className="h-4 w-5/6 animate-pulse rounded-md bg-border" />
            <div className="h-4 w-4/6 animate-pulse rounded-md bg-border" />
          </div>
        </section>

        {/* ── 4. Reviews section ── */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-border" />
          <div className="mt-6 space-y-3">
            <div className="h-20 animate-pulse rounded-2xl border border-border bg-background" />
            <div className="h-20 animate-pulse rounded-2xl border border-border bg-background" />
          </div>
        </section>

      </div>
    </div>
  );
}
