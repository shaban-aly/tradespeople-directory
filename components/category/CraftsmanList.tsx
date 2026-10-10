"use client";

import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { useCategoryCraftsmen } from "@/hooks/category/useCategoryCraftsmen";
import { CategorySidebar } from "@/components/category/CategorySidebar";
import { CraftsmanFilters } from "@/components/category/CraftsmanFilters";
import { CraftsmanGrid } from "@/components/shared/ui/CraftsmanGrid";
import { BottomSheet } from "@/components/shared/ui/BottomSheet";
import { Button, ButtonLink } from "@/components/shared/ui/Button";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { IconUserPlus, IconCheck } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

interface CraftsmanListProps {
  craftsmen: Craftsman[];
  areas: string[];
  category?: Category;
}

export function CraftsmanList({
  craftsmen,
  areas,
  category,
}: CraftsmanListProps) {
  const {
    selectedArea,
    setSelectedArea,
    sort,
    setSort,
    isSheetOpen,
    setIsSheetOpen,
    availableAreas,
    hasFilters,
    activeFilterCount,
    filteredCraftsmen,
    resetFilters,
  } = useCategoryCraftsmen({ craftsmen, areas });

  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
      {/* 1. السايدبار الثابت على شاشات الديسكتوب (مثل صفحة البحث) */}
      <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0 sticky top-24">
        <CategorySidebar
          availableAreas={availableAreas}
          selectedArea={selectedArea}
          onAreaChange={setSelectedArea}
          sort={sort}
          onSortChange={setSort}
          craftsmen={craftsmen}
          onReset={resetFilters}
          hasFilters={hasFilters}
          activeCount={activeFilterCount}
        />
      </aside>

      {/* 2. منطقة النتائج الرئيسية وفلاتر الموبايل */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* شريط الفلاتر السريعة يظهر فقط على الموبايل والتابلت */}
        <div className="lg:hidden">
          <CraftsmanFilters
            availableAreas={availableAreas}
            selectedArea={selectedArea}
            onAreaChange={setSelectedArea}
            sort={sort}
            onSortChange={setSort}
            onOpenSheet={() => setIsSheetOpen(true)}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* نافذة التصفية السفلية للموبايل (Bottom Sheet) */}
        <BottomSheet
          open={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title="تعديل خيارات العرض"
          footer={
            <Button
              type="button"
              onClick={() => setIsSheetOpen(false)}
              className="w-full"
            >
              عرض النتائج ({toArabicDigits(filteredCraftsmen.length)})
            </Button>
          }
        >
          <div className="flex flex-col gap-5 py-2">
            {/* قسم الترتيب */}
            <section className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4">
              <h3 className="font-heading text-sm font-bold text-foreground">
                ترتيب النتائج
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSort("verified")}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all ${
                    sort === "verified"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border/80 bg-background text-muted hover:border-accent hover:text-foreground"
                  }`}
                >
                  {sort === "verified" && <IconCheck className="h-3.5 w-3.5" />}
                  <span>الموثّقون أولاً</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSort("recent")}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all ${
                    sort === "recent"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border/80 bg-background text-muted hover:border-accent hover:text-foreground"
                  }`}
                >
                  {sort === "recent" && <IconCheck className="h-3.5 w-3.5" />}
                  <span>الأحدث تسجيلاً</span>
                </button>
              </div>
            </section>

            {/* قسم المناطق */}
            <section className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4">
              <h3 className="font-heading text-sm font-bold text-foreground">
                اختر المنطقة
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedArea("all")}
                  className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-xs font-bold transition-all ${
                    selectedArea === "all"
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border/80 bg-background text-foreground hover:border-accent"
                  }`}
                >
                  كل المناطق
                </button>
                {availableAreas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSelectedArea(area)}
                    className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-xs font-bold transition-all ${
                      selectedArea === area
                        ? "border-accent bg-accent text-on-accent"
                        : "border-border/80 bg-background text-foreground hover:border-accent"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </BottomSheet>

        {/* المحتوى الرئيسي: القائمة أو الحالة الفارغة */}
        {filteredCraftsmen.length === 0 ? (
          <EmptyState
            title="لا يوجد صنايعية في هذه المنطقة حالياً"
            description={
              hasFilters
                ? "جرّب اختيار منطقة أخرى أو مسح الفلاتر لعرض كافة فنيي التخصص."
                : `لم ينضم أي صنايعي إلى تخصص ${category?.name ?? "هذا المجال"} بعد — ساهم معنا وكن أول المسجلين!`
            }
            action={
              hasFilters ? (
                <Button type="button" onClick={resetFilters}>
                  عرض كل المناطق
                </Button>
              ) : (
                <ButtonLink href="/join" variant="action" size="md">
                  <span className="flex items-center gap-2">
                    <IconUserPlus className="h-4 w-4" />
                    <span>سجّل كأول صنايعي في هذا التخصص</span>
                  </span>
                </ButtonLink>
              )
            }
          />
        ) : (
          <CraftsmanGrid
            craftsmen={filteredCraftsmen}
            categories={category ? [category] : []}
            gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
            toolbar={
              <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-muted">
                <p>
                  عرض {toArabicDigits(filteredCraftsmen.length)}{" "}
                  {filteredCraftsmen.length === 1 ? "صنايعي متاح" : "صنايعي متاحين"}
                  {selectedArea !== "all" && ` في ${selectedArea}`}
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="font-bold text-accent hover:underline"
                  >
                    إعادة ضبط الفلاتر
                  </button>
                )}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
