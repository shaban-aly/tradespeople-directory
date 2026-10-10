"use client";

import { IconStar } from "@/components/shared/icons";
import { AuthGuardModal } from "@/components/shared/auth/AuthGuardModal";
import { useFavorites } from "@/hooks/craftsman/useFavorites";

export function FavoriteButton({ slug }: { slug: string }) {
  const {
    isFavorite,
    toggleFavorite,
    authOpen,
    authOptions,
    onAuthClose,
    onAuthSuccess,
  } = useFavorites();
  const active = isFavorite(slug);

  return (
    <>
      <button
        type="button"
        onClick={() => toggleFavorite(slug)}
        aria-pressed={active}
        aria-label={active ? "إزالة من المحفوظات" : "حفظ في المحفوظات"}
        title={active ? "إزالة من المحفوظات" : "حفظ في المحفوظات"}
        className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border shadow-2xs backdrop-blur-md transition-all duration-200 active:scale-90 hover:scale-105 ${
          active
            ? "border-accent bg-accent text-on-accent shadow-accent/20"
            : "border-border/80 bg-card/90 text-muted hover:border-accent hover:text-accent hover:shadow-xs"
        }`}
      >
        <IconStar className={`h-4.5 w-4.5 ${active ? "fill-current" : ""}`} />
      </button>

      <AuthGuardModal
        open={authOpen}
        onClose={onAuthClose}
        onSuccess={onAuthSuccess}
        title={authOptions.title}
        message={authOptions.message}
        actionDescription={authOptions.actionDescription}
      />
    </>
  );
}