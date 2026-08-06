"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/data/craftsmen";
import { searchHref } from "@/lib/utils/url";
import { toArabicDigits } from "@/lib/utils/format";
import { BottomSheet } from "@/components/shared/ui/BottomSheet";
import { IconChevronDown, IconSliders } from "@/components/shared/icons";
import {
  FilterSections,
  activeFilterCount,
  type CurrentFilters,
} from "@/components/search/FilterSections";

export { type CurrentFilters } from "@/components/search/FilterSections";

export function SearchFilters({
  categories,
  areas,
  current,
}: {
  categories: Category[];
  areas: string[];
  current: CurrentFilters;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function update(next: Partial<Omit<CurrentFilters, "query">>) {
    const merged = {
      category: next.category ?? current.category,
      area: next.area ?? current.area,
      sort: next.sort ?? current.sort,
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-base font-bold text-foreground shadow-card transition-colors hover:border-accent sm:hidden"
      >
        <span className="flex items-center gap-2">
          <IconSliders className="h-5 w-5 text-muted" />
          تعديل الفلاتر
        </span>
        <span className="flex items-center gap-2">
          {count > 0 ? (
            <span className="flex min-w-6 h-6 items-center justify-center rounded-full bg-accent px-2 text-sm font-bold text-on-accent">
              {toArabicDigits(count)}
            </span>
          ) : null}
          <IconChevronDown className="h-5 w-5 text-muted" />
        </span>
      </button>

      <div className="hidden sm:block">
        <FilterSections
          categories={categories}
          areas={areas}
          current={current}
          onUpdate={update}
        />
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="تعديل الفلاتر"
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
          >
            عرض النتائج
          </button>
        }
      >
        <FilterSections
          categories={categories}
          areas={areas}
          current={current}
          onUpdate={update}
        />
      </BottomSheet>
    </>
  );
}
