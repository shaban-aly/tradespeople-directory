"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@/lib/data/craftsmen";
import { searchHref } from "@/lib/utils/url";
import { toArabicDigits } from "@/lib/utils/format";
import { IconSliders } from "@/components/shared/icons";
import {
  FilterSections,
  activeFilterCount,
  type CurrentFilters,
} from "@/components/search/FilterSections";

export function SearchSidebar({
  categories,
  areas,
  current,
}: {
  categories: Category[];
  areas: string[];
  current: CurrentFilters;
}) {
  const router = useRouter();

  function update(next: Partial<Omit<CurrentFilters, "query">>) {
    const merged = {
      category: next.category !== undefined ? next.category : current.category,
      area: next.area !== undefined ? next.area : current.area,
      sort: next.sort !== undefined ? next.sort : current.sort,
    };
    router.push(
      searchHref({
        q: current.query,
        category: merged.category,
        area: merged.area,
        sort: merged.sort,
      }),
    );
  }

  const count = activeFilterCount(current);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs max-h-[calc(100vh-7rem)] overflow-y-auto">
      {/* رأس السايدبار */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <IconSliders className="h-4 w-4 text-accent" />
          <h2 className="text-base font-extrabold text-foreground">
            تصفية النتائج
          </h2>
          {count > 0 && (
            <span className="flex min-w-5 h-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-on-accent">
              {toArabicDigits(count)}
            </span>
          )}
        </div>

        {count > 0 && (
          <button
            type="button"
            onClick={() => update({ category: "", area: "", sort: "verified" })}
            className="text-xs font-semibold text-muted hover:text-danger transition-colors cursor-pointer"
          >
            مسح الكل
          </button>
        )}
      </div>

      {/* أقسام الفلاتر */}
      <FilterSections
        categories={categories}
        areas={areas}
        current={current}
        onUpdate={update}
      />
    </div>
  );
}
