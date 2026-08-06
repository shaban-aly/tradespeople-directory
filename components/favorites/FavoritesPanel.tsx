"use client";

import Link from "next/link";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { useFavorites } from "@/hooks/useFavorites";
import { CraftsmanGrid } from "@/components/shared/ui/CraftsmanGrid";
import { toArabicDigits } from "@/lib/utils/format";

export function FavoritesPanel({
  craftsmen,
  categories,
}: {
  craftsmen: Craftsman[];
  categories: Category[];
}) {
  const { favorites, count } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <p className="font-heading text-xl font-bold">
          لسه مفيش محفوظات
        </p>
        <p className="mt-2 text-base text-muted">
          اضغط أيقونة النجمة على أي كارت صنايعي وحتلاقيه هنا في أي وقت.
        </p>
        <Link
          href="/categories"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
        >
          تصفّح التصنيفات
        </Link>
      </div>
    );
  }

  const saved = craftsmen.filter((craftsman) =>
    favorites.includes(craftsman.slug),
  );

  return (
    <CraftsmanGrid
      craftsmen={saved}
      categories={categories}
      toolbar={
        <p className="text-base text-muted">
          {toArabicDigits(count)}{" "}
          {count === 1 ? "صنايعي محفوظ" : "صنايعية محفوظين"}
        </p>
      }
    />
  );
}
