/** Skeleton مطابق لصفحة /category/[slug]
 *  الصفحة الحقيقية:
 *    1) section header: bg-card border-b (gradient + icon + h1 + chips)
 *    2) section list: max-w-5xl (CraftsmanList)
 */
export default function Loading() {
  return (
    <div role="status" aria-label="جاري التحميل">
      {/* ============ Header Section ============ */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="relative mx-auto w-full max-w-5xl px-4 py-10">
          <div className="flex items-start gap-4">
            {/* Icon box */}
            <div className="h-[60px] w-[60px] shrink-0 animate-pulse rounded-2xl bg-accent/20" />
            <div className="min-w-0 flex-1 space-y-3">
              {/* "دليل الصنايعية · السويس" */}
              <div className="h-4 w-36 animate-pulse rounded-md bg-border" />
              {/* h1 */}
              <div className="h-9 w-40 animate-pulse rounded-xl bg-border" />
              {/* subtitle */}
              <div className="h-5 w-72 max-w-full animate-pulse rounded-md bg-border" />
            </div>
          </div>

          {/* Chips row — صنايعية / موثق / منطقة */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="h-9 w-24 animate-pulse rounded-full border border-border bg-background" />
            <div className="h-9 w-20 animate-pulse rounded-full border border-border bg-background" />
            <div className="h-9 w-24 animate-pulse rounded-full border border-border bg-background" />
          </div>
        </div>
      </section>

      {/* ============ List Section ============ */}
      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        {/* Filter bar */}
        <div className="mb-6 flex gap-2">
          <div className="h-10 w-32 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-10 w-24 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-10 w-28 animate-pulse rounded-xl border border-border bg-card" />
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 shadow-card"
            >
              {/* Avatar row */}
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-28 animate-pulse rounded-md bg-border" />
                  <div className="h-4 w-20 animate-pulse rounded-md bg-border" />
                </div>
              </div>
              {/* Badges */}
              <div className="flex gap-2">
                <div className="h-6 w-16 animate-pulse rounded-full bg-border" />
                <div className="h-6 w-14 animate-pulse rounded-full bg-border" />
              </div>
              {/* Buttons */}
              <div className="mt-1 flex gap-2">
                <div className="h-11 flex-1 animate-pulse rounded-xl bg-border" />
                <div className="h-11 flex-1 animate-pulse rounded-xl bg-border" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
