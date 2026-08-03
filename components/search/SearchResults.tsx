import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { toArabicDigits } from "@/lib/utils/format";

export function SearchResults({
  craftsmen,
  categories,
  query,
}: {
  craftsmen: Craftsman[];
  categories: Category[];
  query: string;
}) {
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));

  return (
    <div className="mt-6">
      <p className="mb-4 text-base text-muted">
        {toArabicDigits(craftsmen.length)}{" "}
        {craftsmen.length === 1 ? "صنايعي" : "صنايعية"}
      </p>

      {craftsmen.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <p className="font-heading text-xl font-bold">لا توجد نتائج</p>
          <p className="mt-2 text-base text-muted">
            {query
              ? `لم نجد صنايعي مطابقاً لـ «${query}» — جرّب كلمة أخرى أو أزل بعض الفلاتر.`
              : "جرّب كتابة اسم صنايعي أو تخصص أو منطقة."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {craftsmen.map((craftsman) => (
            <CraftsmanCard
              key={craftsman.id}
              craftsman={craftsman}
              category={categoryMap.get(craftsman.category)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
