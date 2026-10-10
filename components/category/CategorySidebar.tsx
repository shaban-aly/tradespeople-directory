"use client";

import { useMemo } from "react";
import type { Craftsman, CraftsmanSort } from "@/lib/data/craftsmen";
import { IconSliders, IconCheck, IconShieldCheck, IconClock } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

interface CategorySidebarProps {
  availableAreas: string[];
  selectedArea: string;
  onAreaChange: (area: string) => void;
  sort: CraftsmanSort;
  onSortChange: (sort: CraftsmanSort) => void;
  craftsmen: Craftsman[];
  onReset: () => void;
  hasFilters: boolean;
  activeCount: number;
}

export function CategorySidebar({
  availableAreas,
  selectedArea,
  onAreaChange,
  sort,
  onSortChange,
  craftsmen,
  onReset,
  hasFilters,
  activeCount,
}: CategorySidebarProps) {
  // حساب عدد الصنايعية في كل منطقة متاحة
  const areaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of craftsmen) {
      counts[c.area] = (counts[c.area] || 0) + 1;
    }
    return counts;
  }, [craftsmen]);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs max-h-[calc(100vh-7rem)] overflow-y-auto">
      {/* رأس السايدبار */}
      <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <IconSliders className="h-4 w-4 text-accent" />
          <h2 className="text-base font-extrabold text-foreground">
            تصفية الصنايعية
          </h2>
          {activeCount > 0 && (
            <span className="flex min-w-5 h-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-on-accent">
              {toArabicDigits(activeCount)}
            </span>
          )}
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-muted hover:text-danger transition-colors cursor-pointer"
          >
            مسح الكل
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* قسم الترتيب */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
            <span aria-hidden="true" className="h-3.5 w-1 rounded-full bg-accent" />
            ترتيب الفنيين
          </h3>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => onSortChange("verified")}
              className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs font-bold transition-all ${
                sort === "verified"
                  ? "border border-accent/40 bg-accent/10 text-accent"
                  : "border border-transparent text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <IconShieldCheck className="h-4 w-4" />
                <span>الموثّقون أولاً</span>
              </span>
              {sort === "verified" && <IconCheck className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => onSortChange("recent")}
              className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs font-bold transition-all ${
                sort === "recent"
                  ? "border border-accent/40 bg-accent/10 text-accent"
                  : "border border-transparent text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <IconClock className="h-4 w-4" />
                <span>الأحدث تسجيلاً</span>
              </span>
              {sort === "recent" && <IconCheck className="h-3.5 w-3.5" />}
            </button>
          </div>
        </section>

        {/* قسم المناطق */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <span aria-hidden="true" className="h-3.5 w-1 rounded-full bg-accent" />
              المنطقة والحي
            </h3>
            <span className="text-xs font-semibold text-muted">
              {toArabicDigits(availableAreas.length)} مناطق
            </span>
          </div>

          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pe-1">
            {/* خيار كل المناطق */}
            <button
              type="button"
              onClick={() => onAreaChange("all")}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                selectedArea === "all"
                  ? "bg-accent text-on-accent shadow-2xs"
                  : "text-foreground hover:bg-background"
              }`}
            >
              <span>كل المناطق</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  selectedArea === "all"
                    ? "bg-black/20 text-white"
                    : "bg-muted/10 text-muted"
                }`}
              >
                {toArabicDigits(craftsmen.length)}
              </span>
            </button>

            {/* قائمة المناطق المتوفر بها فنيون */}
            {availableAreas.map((area) => {
              const isSelected = selectedArea === area;
              const count = areaCounts[area] || 0;

              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => onAreaChange(area)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-accent text-on-accent shadow-2xs"
                      : "text-foreground hover:bg-background"
                  }`}
                >
                  <span className="truncate">{area}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isSelected
                        ? "bg-black/20 text-white"
                        : "bg-muted/10 text-muted"
                    }`}
                  >
                    {toArabicDigits(count)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* تذكير بالثقة والأمان */}
        <div className="rounded-xl border border-border/60 bg-background/60 p-3.5 text-xs text-muted leading-relaxed">
          <p className="font-semibold text-foreground mb-1">
            تواصل مباشر مع الصنايعي
          </p>
          اتصل أو راسل واتساب فوراً دون أي وسطاء أو رسوم خفية.
        </div>
      </div>
    </div>
  );
}
