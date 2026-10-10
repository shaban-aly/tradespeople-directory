"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/data/craftsmen";
import { searchHref } from "@/lib/utils/url";
import { toArabicDigits } from "@/lib/utils/format";
import { BottomSheet } from "@/components/shared/ui/BottomSheet";
import { Button } from "@/components/shared/ui/Button";
import { IconChevronDown, IconSliders, IconX } from "@/components/shared/icons";
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
  const [draft, setDraft] = useState<CurrentFilters>(current);

  // مزامنة المسودة عند تغير الفلاتر المطبقة من الخارج
  useEffect(() => {
    setDraft(current);
  }, [current.query, current.category, current.area, current.sort]);

  function handleOpen() {
    setDraft(current);
    setOpen(true);
  }

  function handleClose() {
    setDraft(current);
    setOpen(false);
  }

  // تحديث محلي للمسودة داخل النافذة دون إرسال طلبات للسيرفر
  function updateDraft(next: Partial<Omit<CurrentFilters, "query">>) {
    setDraft((prev) => ({
      ...prev,
      category: next.category !== undefined ? next.category : prev.category,
      area: next.area !== undefined ? next.area : prev.area,
      sort: next.sort !== undefined ? next.sort : prev.sort,
    }));
  }

  // إعادة ضبط خيارات المسودة داخل النافذة
  function resetDraft() {
    setDraft((prev) => ({
      ...prev,
      category: "",
      area: "",
      sort: "verified",
    }));
  }

  // تطبيق الفلاتر عند الضغط على «عرض النتائج»
  function applyFilters() {
    setOpen(false);
    const isModified =
      draft.category !== current.category ||
      draft.area !== current.area ||
      draft.sort !== current.sort;

    if (isModified) {
      router.push(
        searchHref({
          q: current.query,
          category: draft.category,
          area: draft.area,
          sort: draft.sort,
        }),
      );
    }
  }

  // إزالة سريعة لفلتر من شريط الفلاتر النشطة في الصفحة الرئيسية
  function removeFilter(key: "category" | "area" | "sort") {
    const nextFilters = {
      category: key === "category" ? "" : current.category,
      area: key === "area" ? "" : current.area,
      sort: key === "sort" ? ("verified" as const) : current.sort,
    };
    router.push(
      searchHref({
        q: current.query,
        category: nextFilters.category,
        area: nextFilters.area,
        sort: nextFilters.sort,
      }),
    );
  }

  function clearAll() {
    router.push(
      searchHref({
        q: current.query,
        category: "",
        area: "",
        sort: "verified",
      }),
    );
  }

  const activeCount = activeFilterCount(current);
  const draftCount = activeFilterCount(draft);
  const selectedCategoryName = categories.find((c) => c.slug === current.category)?.name;

  return (
    <div className="mb-4 space-y-3">
      {/* زر فتح الفلاتر على الموبايل والتابلت (مخفي على الديسكتوب lg لوجود السايدبار) */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={handleOpen}
          className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-sm font-bold shadow-2xs transition-all active:scale-[0.99] cursor-pointer ${
            activeCount > 0
              ? "border-accent/40 bg-accent/5 text-foreground"
              : "border-border bg-card text-foreground hover:border-accent/60"
          }`}
        >
          <span className="flex items-center gap-2">
            <IconSliders className="h-4 w-4 text-accent" />
            <span>تصفية النتائج والفلاتر</span>
          </span>
          <span className="flex items-center gap-2">
            {activeCount > 0 ? (
              <span className="flex min-w-5 h-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-on-accent">
                {toArabicDigits(activeCount)}
              </span>
            ) : null}
            <IconChevronDown className="h-4 w-4 text-muted" />
          </span>
        </button>
      </div>

      {/* شريط الفلاتر المطبقة الفورية (Active Filters Bar) */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-bold text-muted">الفلاتر المطبقة:</span>

          {current.category && (
            <button
              type="button"
              onClick={() => removeFilter("category")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-semibold text-accent transition-colors hover:bg-accent/20 cursor-pointer"
            >
              <span>التخصص: {selectedCategoryName || current.category}</span>
              <IconX className="h-3 w-3" />
            </button>
          )}

          {current.area && (
            <button
              type="button"
              onClick={() => removeFilter("area")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-semibold text-accent transition-colors hover:bg-accent/20 cursor-pointer"
            >
              <span>المنطقة: {current.area}</span>
              <IconX className="h-3 w-3" />
            </button>
          )}

          {current.sort !== "verified" && (
            <button
              type="button"
              onClick={() => removeFilter("sort")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-semibold text-accent transition-colors hover:bg-accent/20 cursor-pointer"
            >
              <span>الترتيب: الأحدث أولاً</span>
              <IconX className="h-3 w-3" />
            </button>
          )}

          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-muted hover:text-danger underline transition-colors ms-1 cursor-pointer"
          >
            مسح الكل
          </button>
        </div>
      )}

      {/* نافذة الفلاتر السفلية للموبايل */}
      <BottomSheet
        open={open}
        onClose={handleClose}
        title="تصفية نتائج البحث"
        footer={
          <div className="flex items-center gap-2.5">
            {draftCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={resetDraft}
                className="shrink-0 min-h-12 px-3 text-sm"
              >
                إعادة ضبط
              </Button>
            )}
            <Button
              type="button"
              onClick={applyFilters}
              className="flex-1 min-h-12"
              variant="primary"
            >
              عرض النتائج {draftCount > 0 ? `(${toArabicDigits(draftCount)})` : ""}
            </Button>
          </div>
        }
      >
        <FilterSections
          categories={categories}
          areas={areas}
          current={draft}
          onUpdate={updateDraft}
        />
      </BottomSheet>
    </div>
  );
}
