/** Skeleton مطابق لصفحة /categories
 *  الصفحة الحقيقية: section header (border-b bg-card) + section grid
 */
export default function Loading() {
  return (
    <div role="status" aria-label="جاري التحميل">
      {/* Header section — يطابق border-b border-border bg-card */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-3">
          {/* "دليل الصنايعية · السويس" */}
          <div className="h-4 w-44 animate-pulse rounded-md bg-border" />
          {/* h1 "كل التصنيفات" */}
          <div className="h-9 w-48 animate-pulse rounded-xl bg-border" />
          {/* subtitle */}
          <div className="h-5 w-72 max-w-full animate-pulse rounded-md bg-border" />
        </div>
      </section>

      {/* Grid section — يطابق CategoryGrid */}
      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              {/* icon */}
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-border" />
              <div className="flex-1 space-y-2">
                {/* name */}
                <div className="h-5 w-24 animate-pulse rounded-md bg-border" />
                {/* count */}
                <div className="h-4 w-16 animate-pulse rounded-md bg-border" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
