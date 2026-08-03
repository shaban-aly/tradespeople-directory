"use client";

import { useState } from "react";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import {
  getAvailableAreas,
  sortCraftsmen,
  type CraftsmanSort,
} from "@/lib/data/craftsmen";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { toArabicDigits } from "@/lib/utils/format";

const sortOptions: { value: CraftsmanSort; label: string }[] = [
  { value: "verified", label: "الموثّقون أولاً" },
  { value: "recent", label: "الأحدث أولاً" },
];

export function CraftsmanList({
  craftsmen,
  areas,
  category,
}: {
  craftsmen: Craftsman[];
  areas: string[];
  category?: Category;
}) {
  const [area, setArea] = useState("all");
  const [sort, setSort] = useState<CraftsmanSort>("verified");

  const availableAreas = getAvailableAreas(craftsmen, areas);
  const hasFilters = area !== "all";

  const filtered = sortCraftsmen(
    hasFilters ? craftsmen.filter((c) => c.area === area) : craftsmen,
    sort,
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-base font-bold">ترتيب:</span>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as CraftsmanSort)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground focus:border-accent focus:outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold">المنطقة:</span>
          <button
            type="button"
            onClick={() => setArea("all")}
            aria-pressed={area === "all"}
            className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-base font-bold transition-colors ${
              area === "all"
                ? "border-accent bg-accent text-on-accent"
                : "border-border bg-card text-foreground hover:border-accent hover:text-accent"
            }`}
          >
            كل المناطق
          </button>
          {availableAreas.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setArea(a)}
              aria-pressed={area === a}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-base font-bold transition-colors ${
                area === a
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border bg-card text-foreground hover:border-accent hover:text-accent"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-base text-muted">
        {toArabicDigits(filtered.length)}{" "}
        {filtered.length === 1 ? "صنايعي متاح" : "صنايعية متاحين"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <p className="font-heading text-xl font-bold">
            لا يوجد صنايعية حالياً
          </p>
          <p className="mt-2 text-base text-muted">
            {hasFilters
              ? "جرّب اختيار منطقة أخرى أو إزالة الفلاتر."
              : "سجّل أول من ينضم لهذا التخصص."}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setArea("all")}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
            >
              عرض كل المناطق
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((craftsman) => (
            <CraftsmanCard
              key={craftsman.id}
              craftsman={craftsman}
              category={category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
