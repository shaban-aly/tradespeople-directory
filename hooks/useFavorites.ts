"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  readFavoritesCached,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/recommendations";

const EMPTY_FAVORITES: string[] = [];

export function useFavorites() {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    readFavoritesCached,
    () => EMPTY_FAVORITES,
  );

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  return {
    favorites,
    count: favorites.length,
    isFavorite: (slug: string) => favoriteSet.has(slug),
    toggleFavorite,
  };
}
