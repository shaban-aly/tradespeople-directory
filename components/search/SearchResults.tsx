import Link from "next/link";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CraftsmanGrid } from "@/components/shared/ui/CraftsmanGrid";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { SearchTracker } from "@/components/search/SearchTracker";
import { toArabicDigits } from "@/lib/utils/format";
import { ButtonLink } from "@/components/shared/ui/Button";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconSearch, IconUserPlus } from "@/components/shared/icons";
import { categoryHref } from "@/lib/utils/url";
import { categoryColor } from "@/lib/utils/categoryColor";

export function SearchResults({
  craftsmen,
  categories,
  query,
  category,
  area,
}: {
  craftsmen: Craftsman[];
  categories: Category[];
  query: string;
  category?: string;
  area?: string;
}) {
  const hasFilters = Boolean(query.trim() || category || area);
  const popularCategories = categories.slice(0, 8);

  return (
    <div className="mt-6">
      <SearchTracker query={query} resultsCount={craftsmen.length} />
      {craftsmen.length === 0 ? (
        <div className="space-y-8">
          <EmptyState
            icon={<IconSearch className="h-6 w-6 text-accent" />}
            title="لم نجد نتائج مطابقة"
            description={
              query.trim()
                ? `لم نجد صنايعي مطابقاً لـ «${query.trim()}» — جرّب كلمة أخرى أو أزل بعض الفلاتر.`
                : hasFilters
                ? "لا توجد نتائج تطابق الفلاتر المحددة حالياً — جرّب اختيار منطقة أو تخصص آخر."
                : "جرّب كتابة اسم صنايعي أو تخصص أو منطقة."
            }
            action={
              hasFilters ? (
                <ButtonLink href="/search" variant="primary" size="md">
                  عرض كل الصنايعية (مسح الفلاتر)
                </ButtonLink>
              ) : undefined
            }
          />

          {/* التخصصات المقترحة للاستكشاف السريع */}
          {popularCategories.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-heading text-base font-bold text-foreground sm:text-lg">
                تخصصات شائعة في السويس
              </h2>
              <p className="mt-1 text-sm text-muted">
                يمكنك استكشاف الفنيين المتاحين مباشرة من خلال هذه التخصصات:
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {popularCategories.map((cat) => {
                  const color = categoryColor(cat.slug);
                  const count = "count" in cat && typeof cat.count === "number" ? cat.count : 0;
                  return (
                    <Link
                      key={cat.slug}
                      href={categoryHref(cat.slug)}
                      className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-bold text-foreground transition-all hover:border-accent hover:bg-accent/5 active:scale-95 shadow-xs"
                    >
                      <span style={{ color }}>
                        <CategoryIcon name={cat.icon || cat.slug} className="h-4 w-4" />
                      </span>
                      <span>{cat.name}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                          {toArabicDigits(count)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* بطاقة المساهمة وإضافة صنايعي جديد */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/80 bg-linear-to-br from-card via-background to-accent/5 p-6 text-center shadow-card sm:flex-row sm:text-start">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <IconUserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-foreground sm:text-lg">
                  مش لاقي الصنايعي اللي بتدور عليه؟
                </h3>
                <p className="mt-1 text-sm text-muted">
                  ساعد أهالي السويس في إيجاد أفضل الحرفيين واقترح إضافة صنايعي للدليل مجاناً.
                </p>
              </div>
            </div>
            <ButtonLink
              href="/join"
              variant="action"
              size="md"
              className="w-full shrink-0 sm:w-auto"
            >
              أضف صنايعي جديد
            </ButtonLink>
          </div>
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
