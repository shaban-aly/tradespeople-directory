"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  readFavoritesCached,
  subscribeFavorites,
  toggleFavorite as toggleLocalFavorite,
  writeFavorites,
} from "@/lib/recommendations";
import { useSession } from "@/hooks/auth/useSession";
import {
  addFavorite,
  getUserFavorites,
  removeFavorite,
} from "@/lib/db/favorites";

const EMPTY_FAVORITES: string[] = [];

// TODO: دمج "مودال الحارس" (Auth Guard Modal) هنا مستقبلاً عند الرغبة في توجيه الزائر غير المسجل لتسجيل الدخول قبل حفظ المفضلة

export function useFavorites() {
  const { user, isLoggedIn } = useSession();

  const favorites = useSyncExternalStore(
    subscribeFavorites,
    readFavoritesCached,
    () => EMPTY_FAVORITES,
  );

  // جلب مفضلات المستخدم المسجل من Supabase واستغلال الكاش
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    let isMounted = true;
    getUserFavorites(user.id).then((serverFavorites) => {
      if (!isMounted) return;
      if (serverFavorites && serverFavorites.length > 0) {
        const currentLocal = readFavoritesCached();
        const merged = Array.from(new Set([...serverFavorites, ...currentLocal]));
        writeFavorites(merged);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, user?.id]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const handleToggleFavorite = useCallback(
    (slug: string) => {
      const willBeFavorite = toggleLocalFavorite(slug);

      // إذا كان المستخدم مسجلاً، نرسل التحديث لـ Supabase مع التحديث التفاؤلي
      if (user?.id) {
        if (willBeFavorite) {
          void addFavorite(user.id, slug);
        } else {
          void removeFavorite(user.id, slug);
        }
      }

      return willBeFavorite;
    },
    [user?.id],
  );

  return {
    favorites,
    count: favorites.length,
    isFavorite: (slug: string) => favoriteSet.has(slug),
    toggleFavorite: handleToggleFavorite,
  };
}
