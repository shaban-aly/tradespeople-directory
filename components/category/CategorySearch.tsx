import { toArabicDigits } from "@/lib/utils/format";
import { IconSearch, IconX, IconSparkles } from "@/components/shared/icons";
import type { CategoryFilterType } from "@/hooks/category/useCategoryDirectory";

interface CategorySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: CategoryFilterType;
  onFilterChange: (filter: CategoryFilterType) => void;
  totalCount: number;
  activeCount: number;
  filteredCount: number;
}

export function CategorySearch({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  totalCount,
  activeCount,
  filteredCount,
}: CategorySearchProps) {
  const isFiltered = searchQuery.trim().length > 0 || activeFilter !== "all";

  return (
    <div className="flex flex-col gap-4">
      {/* حقل البحث السريع */}
      <div className="relative w-full">
        <label htmlFor="category-search" className="sr-only">
          ابحث في التصنيفات
        </label>
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-muted">
          <IconSearch className="h-5 w-5" />
        </div>
        <input
          id="category-search"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث عن مهنة أو تخصص (مثال: سباكة، نجارة، تكييف، نقاشة...)"
          className="w-full min-h-12 rounded-xl border border-border/80 bg-card pe-11 ps-11 text-base text-foreground placeholder:text-muted/70 shadow-2xs transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="مسح البحث"
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted hover:text-foreground transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/10 hover:bg-muted/20">
              <IconX className="h-4 w-4" />
            </span>
          </button>
        )}
      </div>

      {/* شريط الفلاتر السريعة والعداد */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2" role="tablist" aria-label="تصفية التخصصات">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === "all"}
            onClick={() => onFilterChange("all")}
            className={`min-h-10 rounded-full px-4 text-xs sm:text-sm font-bold transition-all ${
              activeFilter === "all"
                ? "bg-foreground text-background shadow-2xs"
                : "border border-border/70 bg-card text-muted hover:border-accent hover:text-foreground"
            }`}
          >
            كل التخصصات ({toArabicDigits(totalCount)})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === "active"}
            onClick={() => onFilterChange("active")}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-xs sm:text-sm font-bold transition-all ${
              activeFilter === "active"
                ? "bg-accent text-on-accent shadow-2xs"
                : "border border-border/70 bg-card text-muted hover:border-accent hover:text-foreground"
            }`}
          >
            <IconSparkles className="h-3.5 w-3.5" />
            <span>بها صنايعية مسجلين ({toArabicDigits(activeCount)})</span>
          </button>
        </div>

        {isFiltered && (
          <span className="text-xs font-semibold text-muted">
            النتائج: {toArabicDigits(filteredCount)} من أصل {toArabicDigits(totalCount)}
          </span>
        )}
      </div>
    </div>
  );
}
