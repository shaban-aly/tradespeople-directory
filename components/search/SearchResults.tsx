import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CraftsmanGrid } from "@/components/shared/ui/CraftsmanGrid";
import { SearchTracker } from "@/components/search/SearchTracker";
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
  return (
    <div className="mt-6">
      <SearchTracker query={query} />
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
        <CraftsmanGrid
          craftsmen={craftsmen}
          categories={categories}
          toolbar={
            <p className="text-base text-muted">
              {toArabicDigits(craftsmen.length)}{" "}
              {craftsmen.length === 1 ? "صنايعي" : "صنايعية"}
            </p>
          }
        />
      )}
    </div>
  );
}
