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
      className="mx-auto w-full max-w-4xl px-4 pb-8 pt-4"
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
          <div className="relative flex h-64 w-full items-center justify-center overflow-hidden bg-card sm:h-80">
            <div className="absolute inset-0 animate-pulse bg-border opacity-60" />
          </div>

          {/* Content area */}
          <div className="p-6 sm:p-8">
            {/* Name + verified */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-48 animate-pulse rounded-xl bg-border" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-accent/20" />
            </div>

            {/* Badges: category + area + views */}
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="h-7 w-20 animate-pulse rounded-full bg-border" />
              <div className="h-7 w-24 animate-pulse rounded-full bg-border" />
              <div className="h-7 w-16 animate-pulse rounded-full bg-border" />
            </div>

            {/* Contact section (desktop only) */}
            <div className="mt-5 hidden flex-col gap-4 border-t border-border pt-5 sm:flex">
              {/* "اتصل مباشرة على ..." */}
              <div className="mx-auto h-5 w-48 animate-pulse rounded-md bg-border" />
              {/* Rating */}
              <div className="mx-auto h-8 w-32 animate-pulse rounded-full bg-border" />
              {/* Action buttons */}
              <div className="flex gap-3">
                <div className="h-12 flex-1 animate-pulse rounded-2xl bg-accent/20" />
                <div className="h-12 flex-1 animate-pulse rounded-2xl bg-border" />
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
