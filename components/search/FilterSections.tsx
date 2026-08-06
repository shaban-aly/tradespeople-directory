"use client";

import type { Category, CraftsmanSort } from "@/lib/data/craftsmen";

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
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-base font-bold transition-colors ${
    active
      ? "border-accent bg-accent text-on-accent"
      : "border-border bg-background text-foreground hover:border-accent hover:text-accent"
  }`;
}

function sectionClass() {
  return "rounded-xl border border-border bg-card p-4";
}

function sectionTitle(title: string) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-foreground">
      <span aria-hidden className="h-4 w-1 rounded-full bg-accent" />
      {title}
    </h2>
  );
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
  return (
    <div className="flex flex-col gap-4">
      <section className={sectionClass()}>
        {sectionTitle("التخصص")}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdate({ category: "" })}
            aria-pressed={current.category === ""}
            className={chipClass(current.category === "")}
          >
            كل التخصصات
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => onUpdate({ category: category.slug })}
              aria-pressed={current.category === category.slug}
              className={chipClass(current.category === category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className={sectionClass()}>
        {sectionTitle("المنطقة")}
        <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => onUpdate({ area })}
              aria-pressed={current.area === area}
              className={chipClass(current.area === area)}
            >
              {area}
            </button>
          ))}
        </div>
      </section>

      <section className={sectionClass()}>
        {sectionTitle("ترتيب")}
        <select
          value={current.sort}
          onChange={(event) =>
            onUpdate({ sort: event.target.value as CraftsmanSort })
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground focus:border-accent focus:outline-none"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}
