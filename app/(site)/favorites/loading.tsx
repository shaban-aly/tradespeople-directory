import { FavoritesGridSkeleton } from "@/components/favorites/FavoritesSkeleton";

/**
 * شاشة التحميل الهيكلية لصفحة /favorites
 * مطابقة تماماً لتخطيط الصفحة الأصلي: هيدر بحدود سفلية + شبكة كروت المحفوظات
 */
export default function FavoritesLoading() {
  return (
    <div role="status" aria-label="جاري تحميل صفحة المحفوظات">
      {/* ============ Header Section ============ */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="h-4 w-36 animate-pulse rounded-md bg-border/70" />
          <div className="mt-2 h-9 w-40 animate-pulse rounded-xl bg-border" />
          <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded-md bg-border/60" />
        </div>
      </section>

      {/* ============ Grid Section ============ */}
      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="h-5 w-32 animate-pulse rounded-md bg-border/70" />
        </div>
        <FavoritesGridSkeleton count={8} />
      </section>
    </div>
  );
}
