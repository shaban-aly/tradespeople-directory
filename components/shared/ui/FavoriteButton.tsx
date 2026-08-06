"use client";

import { IconStar } from "@/components/shared/icons";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoriteButton({ slug }: { slug: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(slug);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(slug)}
      aria-pressed={active}
      aria-label={active ? "إزالة من المحفوظات" : "حفظ في المحفوظات"}
      title={active ? "إزالة من المحفوظات" : "حفظ في المحفوظات"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-border shadow-sm backdrop-blur transition-colors ${
        active
          ? "bg-accent text-on-accent"
          : "bg-card/90 text-muted hover:text-accent"
      }`}
    >
      <IconStar className={`h-4.5 w-4.5 ${active ? "fill-current" : ""}`} />
    </button>
  );
}
