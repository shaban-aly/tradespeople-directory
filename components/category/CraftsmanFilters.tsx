import type { CraftsmanSort } from "@/lib/data/craftsmen";
import { IconSliders, IconChevronDown } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

interface CraftsmanFiltersProps {
  availableAreas: string[];
  selectedArea: string;
  onAreaChange: (area: string) => void;
  sort: CraftsmanSort;
  onSortChange: (sort: CraftsmanSort) => void;
  onOpenSheet: () => void;
  activeFilterCount: number;
}

const sortOptions: { value: CraftsmanSort; label: string }[] = [
  { value: "verified", label: "الموثّقون أولاً" },
  { value: "recent", label: "الأحدث أولاً" },
];

function chipClass(active: boolean) {
  return `inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border px-4 text-xs sm:text-sm font-bold transition-all active:scale-[0.98] ${
    active
      ? "border-accent bg-accent text-on-accent shadow-2xs"
      : "border-border/80 bg-card text-foreground hover:border-accent hover:text-accent"
  }`;
}

export function CraftsmanFilters({
  availableAreas,
  selectedArea,
  onAreaChange,
  sort,
  onSortChange,
  onOpenSheet,
  activeFilterCount,
}: CraftsmanFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 1. صف التصفية للموبايل: شريط مناطق قابل للتمرير الأفقي + زر الفلاتر المتقدمة */}
      <div className="flex items-center gap-2 sm:hidden">
        <button
          type="button"
          onClick={onOpenSheet}
          aria-label="خيارات الترتيب والتصفية"
          className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 text-xs font-bold text-foreground shadow-2xs transition-colors hover:border-accent"
        >
          <IconSliders className="h-4 w-4 text-muted" />
          <span>ترتيب</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent">
              {toArabicDigits(activeFilterCount)}
            </span>
          )}
          <IconChevronDown className="h-3.5 w-3.5 text-muted" />
        </button>

        <div
          role="region"
          aria-label="تصفية حسب المنطقة"
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1 scrollbar-none"
        >
          <button
            type="button"
            onClick={() => onAreaChange("all")}
            aria-pressed={selectedArea === "all"}
            className={chipClass(selectedArea === "all")}
          >
            كل المناطق
          </button>
          {availableAreas.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => onAreaChange(area)}
              aria-pressed={selectedArea === area}
              className={chipClass(selectedArea === area)}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* 2. صف التصفية للديسكتوب والتابلت */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        {/* كبسولات المناطق */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-muted">المنطقة:</span>
          <button
            type="button"
            onClick={() => onAreaChange("all")}
            aria-pressed={selectedArea === "all"}
            className={chipClass(selectedArea === "all")}
          >
            كل المناطق
          </button>
          {availableAreas.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => onAreaChange(area)}
              aria-pressed={selectedArea === area}
              className={chipClass(selectedArea === area)}
            >
              {area}
            </button>
          ))}
        </div>

        {/* أزرار الترتيب (Segmented Controls) بدلاً من unstyled select */}
        <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 p-1">
          <span className="ps-2 text-xs font-bold text-muted">ترتيب:</span>
          {sortOptions.map((option) => {
            const isSelected = sort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSortChange(option.value)}
                aria-pressed={isSelected}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-foreground text-background shadow-2xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
