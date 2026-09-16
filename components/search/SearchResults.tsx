import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CraftsmanGrid } from "@/components/shared/ui/CraftsmanGrid";
import { EmptyState } from "@/components/shared/ui/EmptyState";
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
      <SearchTracker query={query} resultsCount={craftsmen.length} />
      {craftsmen.length === 0 ? (
        <EmptyState
          title="لا توجد نتائج"
          description={
            query
              ? `لم نجد صنايعي مطابقاً لـ «${query}» — جرّب كلمة أخرى أو أزل بعض الفلاتر.`
              : "جرّب كتابة اسم صنايعي أو تخصص أو منطقة."
          }
        />
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
