import { useState } from "react";
import type { Category, CraftsmanSort } from "@/lib/data/craftsmen";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconChevronDown } from "@/components/shared/icons";
import { categoryColor } from "@/lib/utils/categoryColor";

export type CurrentFilters = {
  query: string;
  category: string;
  area: string;
  sort: CraftsmanSort;
};

export type FilterUpdate = (
  next: Partial<Pick<CurrentFilters, "category" | "area" | "sort">>,
) => void;

const sortOptions: { value: CraftsmanSort; label: string }[] = [
  { value: "verified", label: "الموثّقون أولاً" },
  { value: "recent", label: "الأحدث أولاً" },
];

function chipClass(active: boolean) {
  return `inline-flex min-h-9 items-center justify-center rounded-full border px-3.5 py-1 text-xs sm:text-sm font-semibold transition-all ${
    active
      ? "border-accent bg-accent text-on-accent shadow-2xs"
      : "border-border bg-background text-foreground hover:border-accent hover:text-accent hover:bg-accent/5 active:scale-95"
  }`;
}

export function activeFilterCount(
  current: Pick<CurrentFilters, "category" | "area" | "sort">,
): number {
  return (
    (current.category ? 1 : 0) +
    (current.area ? 1 : 0) +
    (current.sort !== "verified" ? 1 : 0)
  );
}

export function FilterSections({
  categories,
  areas,
  current,
  onUpdate,
}: {
  categories: Category[];
  areas: string[];
  current: CurrentFilters;
  onUpdate: FilterUpdate;
}) {
  const [openSections, setOpenSections] = useState({
    category: true,
    area: Boolean(current.area),
    sort: current.sort !== "verified",
  });

  function toggleSection(section: "category" | "area" | "sort") {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  const selectedCategory = categories.find((c) => c.slug === current.category);
  const selectedSortOption = sortOptions.find((o) => o.value === current.sort);

  return (
    <div className="flex flex-col gap-3.5">
      {/* التخصص */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("category")}
          aria-expanded={openSections.category}
          className="flex w-full items-center justify-between py-1.5 text-start group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span aria-hidden className="h-3.5 w-1 rounded-full bg-accent shrink-0" />
            <span className="text-sm font-bold text-foreground">التخصص</span>
            {selectedCategory && (
              <span className="truncate rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                {selectedCategory.name}
              </span>
            )}
          </div>
          <IconChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-hover:text-foreground ${
              openSections.category ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            openSections.category ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 pt-2.5">
              <button
                type="button"
                onClick={() => onUpdate({ category: "" })}
                aria-pressed={current.category === ""}
                className={chipClass(current.category === "")}
              >
                كل التخصصات
              </button>
              {categories.map((category) => {
                const isActive = current.category === category.slug;
                const color = categoryColor(category.slug);
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() =>
                      onUpdate({
                        category: isActive ? "" : category.slug,
                      })
                    }
                    aria-pressed={isActive}
                    className={`inline-flex min-h-9 items-center gap-1.5 justify-center rounded-full border px-3 py-1 text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? "border-accent bg-accent text-on-accent shadow-2xs"
                        : "border-border bg-background text-foreground hover:border-accent hover:text-accent hover:bg-accent/5 active:scale-95"
                    }`}
                  >
                    <span style={{ color: isActive ? "currentColor" : color }}>
                      <CategoryIcon name={category.icon || category.slug} className="h-3.5 w-3.5" />
                    </span>
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* المنطقة */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("area")}
          aria-expanded={openSections.area}
          className="flex w-full items-center justify-between py-1.5 text-start group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span aria-hidden className="h-3.5 w-1 rounded-full bg-accent shrink-0" />
            <span className="text-sm font-bold text-foreground">المنطقة</span>
            {current.area && (
              <span className="truncate rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                {current.area}
              </span>
            )}
          </div>
          <IconChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-hover:text-foreground ${
              openSections.area ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            openSections.area ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 pt-2.5">
              <button
                type="button"
                onClick={() => onUpdate({ area: "" })}
                aria-pressed={current.area === ""}
                className={chipClass(current.area === "")}
              >
                كل المناطق
              </button>
              {areas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() =>
                    onUpdate({
                      area: current.area === area ? "" : area,
                    })
                  }
                  aria-pressed={current.area === area}
                  className={chipClass(current.area === area)}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* ترتيب النتائج */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection("sort")}
          aria-expanded={openSections.sort}
          className="flex w-full items-center justify-between py-1.5 text-start group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span aria-hidden className="h-3.5 w-1 rounded-full bg-accent shrink-0" />
            <span className="text-sm font-bold text-foreground">ترتيب النتائج</span>
            {selectedSortOption && selectedSortOption.value !== "verified" && (
              <span className="truncate rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                {selectedSortOption.label}
              </span>
            )}
          </div>
          <IconChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-hover:text-foreground ${
              openSections.sort ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            openSections.sort ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 pt-2.5">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onUpdate({ sort: option.value })}
                  aria-pressed={current.sort === option.value}
                  className={chipClass(current.sort === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
