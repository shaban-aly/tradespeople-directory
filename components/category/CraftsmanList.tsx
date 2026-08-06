"use client";

import { useState } from "react";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import {
  getAvailableAreas,
  sortCraftsmen,
  type CraftsmanSort,
} from "@/lib/data/craftsmen";
import { CraftsmanGrid } from "@/components/shared/ui/CraftsmanGrid";
import { BottomSheet } from "@/components/shared/ui/BottomSheet";
import { IconChevronDown, IconSliders } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

const sortOptions: { value: CraftsmanSort; label: string }[] = [
  { value: "verified", label: "الموثّقون أولاً" },
  { value: "recent", label: "الأحدث أولاً" },
];

function chipClass(active: boolean, chipBg: string) {
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-base font-bold transition-colors ${
    active
      ? "border-accent bg-accent text-on-accent"
      : `border-border ${chipBg} text-foreground hover:border-accent hover:text-accent`
  }`;
}

function AreaChips({
  areas,
  selected,
  onChange,
  chipBg,
}: {
  areas: string[];
  selected: string;
  onChange: (area: string) => void;
  chipBg: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onChange("all")}
        aria-pressed={selected === "all"}
        className={chipClass(selected === "all", chipBg)}
      >
        كل المناطق
      </button>
      {areas.map((area) => (
        <button
          key={area}
          type="button"
          onClick={() => onChange(area)}
          aria-pressed={selected === area}
          className={chipClass(selected === area, chipBg)}
        >
          {area}
        </button>
      ))}
    </>
  );
}

function SortSelect({
  sort,
  onChange,
}: {
  sort: CraftsmanSort;
  onChange: (sort: CraftsmanSort) => void;
}) {
  return (
    <select
      id="sort"
      value={sort}
      onChange={(event) => onChange(event.target.value as CraftsmanSort)}
      className="rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground focus:border-accent focus:outline-none"
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function SheetFilters({
  areas,
  area,
  sort,
  onArea,
  onSort,
}: {
  areas: string[];
  area: string;
  sort: CraftsmanSort;
  onArea: (area: string) => void;
  onSort: (sort: CraftsmanSort) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-foreground">
          <span aria-hidden className="h-4 w-1 rounded-full bg-accent" />
          المنطقة
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <AreaChips
            areas={areas}
            selected={area}
            onChange={onArea}
            chipBg="bg-background"
          />
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-foreground">
          <span aria-hidden className="h-4 w-1 rounded-full bg-accent" />
          ترتيب
        </h2>
        <SortSelect sort={sort} onChange={onSort} />
      </section>
    </div>
  );
}

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
  const [sheetOpen, setSheetOpen] = useState(false);

  const availableAreas = getAvailableAreas(craftsmen, areas);
  const hasFilters = area !== "all";
  const activeCount = (area !== "all" ? 1 : 0) + (sort !== "verified" ? 1 : 0);

  const filtered = sortCraftsmen(
    hasFilters ? craftsmen.filter((c) => c.area === area) : craftsmen,
    sort,
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="mb-4 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-base font-bold text-foreground shadow-card transition-colors hover:border-accent sm:hidden"
      >
        <span className="flex items-center gap-2">
          <IconSliders className="h-5 w-5 text-muted" />
          تعديل الفلاتر
        </span>
        <span className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="flex min-w-6 h-6 items-center justify-center rounded-full bg-accent px-2 text-sm font-bold text-on-accent">
              {toArabicDigits(activeCount)}
            </span>
          )}
          <IconChevronDown className="h-5 w-5 text-muted" />
        </span>
      </button>

      <div className="mb-6 hidden flex-col gap-4 sm:flex">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-base font-bold">ترتيب:</span>
          <SortSelect sort={sort} onChange={setSort} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold">المنطقة:</span>
          <AreaChips
            areas={availableAreas}
            selected={area}
            onChange={setArea}
            chipBg="bg-card"
          />
        </div>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="تعديل الفلاتر"
        footer={
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
          >
            عرض الصنايعية
          </button>
        }
      >
        <SheetFilters
          areas={availableAreas}
          area={area}
          sort={sort}
          onArea={setArea}
          onSort={setSort}
        />
      </BottomSheet>

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
        <CraftsmanGrid
          craftsmen={filtered}
          categories={category ? [category] : []}
          toolbar={
            <p className="text-base text-muted">
              {toArabicDigits(filtered.length)}{" "}
              {filtered.length === 1 ? "صنايعي متاح" : "صنايعية متاحين"}
            </p>
          }
        />
      )}
    </div>
  );
}
