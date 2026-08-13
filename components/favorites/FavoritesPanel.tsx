"use client";

import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { useFavorites } from "@/hooks/useFavorites";
import { CraftsmanGrid } from "@/components/shared/ui/CraftsmanGrid";
import { ButtonLink } from "@/components/shared/ui/Button";
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
        <ButtonLink href="/categories" className="mt-5">
          تصفّح التصنيفات
        </ButtonLink>
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
