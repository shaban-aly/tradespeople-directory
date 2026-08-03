"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Category, CraftsmanSort } from "@/lib/data/craftsmen";

const sortOptions: { value: CraftsmanSort; label: string }[] = [
  { value: "verified", label: "الموثّقون أولاً" },
  { value: "recent", label: "الأحدث أولاً" },
];

export type CurrentFilters = {
  query: string;
  category: string;
  area: string;
  sort: CraftsmanSort;
};

function chipClass(active: boolean) {
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-base font-bold transition-colors ${
    active
      ? "border-accent bg-accent text-on-accent"
      : "border-border bg-card text-foreground hover:border-accent hover:text-accent"
  }`;
}

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
  const pathname = usePathname();

  function update(next: Partial<Omit<CurrentFilters, "query">>) {
    const merged = {
      category: next.category ?? current.category,
      area: next.area ?? current.area,
      sort: next.sort ?? current.sort,
    };
    const params = new URLSearchParams();
    if (current.query) params.set("q", current.query);
    if (merged.category) params.set("category", merged.category);
    if (merged.area) params.set("area", merged.area);
    params.set("sort", merged.sort);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-bold">التخصص:</span>
        <button
          type="button"
          onClick={() => update({ category: "" })}
          aria-pressed={current.category === ""}
          className={chipClass(current.category === "")}
        >
          كل التخصصات
        </button>
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => update({ category: category.slug })}
            aria-pressed={current.category === category.slug}
            className={chipClass(current.category === category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-bold">المنطقة:</span>
        <button
          type="button"
          onClick={() => update({ area: "" })}
          aria-pressed={current.area === ""}
          className={chipClass(current.area === "")}
        >
          كل المناطق
        </button>
        {areas.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => update({ area })}
            aria-pressed={current.area === area}
            className={chipClass(current.area === area)}
          >
            {area}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base font-bold">ترتيب:</span>
        <select
          value={current.sort}
          onChange={(event) => update({ sort: event.target.value as CraftsmanSort })}
          className="rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground focus:border-accent focus:outline-none"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
