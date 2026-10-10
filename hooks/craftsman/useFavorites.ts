"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  readFavoritesCached,
  setFavorite,
  subscribeFavorites,
  toggleFavorite as toggleLocalFavorite,
  writeFavorites,
} from "@/lib/recommendations";
import { useSession } from "@/hooks/auth/useSession";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import {
  addFavorite,
  getUserFavorites,
  removeFavorite,
  syncLocalFavoritesToServer,
} from "@/lib/db/favorites";

const EMPTY_FAVORITES: string[] = [];

export function useFavorites() {
  const { user, isLoggedIn } = useSession();
  const authGuard = useAuthGuard();
  const [isLoaded, setIsLoaded] = useState(false);

  const favorites = useSyncExternalStore(
    subscribeFavorites,
    readFavoritesCached,
    () => EMPTY_FAVORITES,
  );

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // جلب مفضلات المستخدم المسجل من Supabase واستغلال الكاش
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    let isMounted = true;
    
    const syncAndLoad = async () => {
      const currentLocal = readFavoritesCached();
      let serverFavorites = await getUserFavorites(user.id);
      
      if (!isMounted) return;

      // العثور على المفضلات المحلية التي لم تكن في السيرفر لرفعها أولاً (فقط إن وجدت)
      const missingOnServer = currentLocal.filter((slug) => !serverFavorites.includes(slug));
      
      if (missingOnServer.length > 0) {
        await syncLocalFavoritesToServer(user.id, missingOnServer);
        if (!isMounted) return;
        // جلبها مرة أخرى بعد الرفع
        serverFavorites = await getUserFavorites(user.id);
        if (!isMounted) return;
      }

      // بمجرد تسجيل الدخول، حالة السيرفر هي المصدر المطلق للحقيقة
      // تستبدل المفضلات المحلية بمفضلات السيرفر
      writeFavorites(serverFavorites);
    };

    void syncAndLoad();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, user?.id]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const performToggle = useCallback(
    (slug: string) => {
      const wasFavorite = favoriteSet.has(slug);
      const willBeFavorite = toggleLocalFavorite(slug);

      // المستخدم مسجّل — نزامن مع Supabase (التحديث التفاؤلي أولاً)
      if (user?.id) {
        const operation = willBeFavorite ? addFavorite : removeFavorite;
        void operation(user.id, slug).then((ok) => {
          if (!ok) {
            // فشل في القاعدة — تراجُع عن الحالة التفاؤلية كي لا تبقى
            // «مفضلة»/«غير مفضلة» خلافاً للـ DB. setFavorite لا يغيّر شيئاً
            // إن كان المستخدم قد نقر مجدداً (الحالة عادت لـ wasFavorite)،
            // فسهل النقر السريع لا يُفسد الحالة.
            setFavorite(slug, wasFavorite);
          }
        });
      }

      return willBeFavorite;
    },
    [user, favoriteSet],
  );

  const toggleFavorite = useCallback(
    (slug: string): boolean => {
      if (isLoggedIn) {
        return performToggle(slug);
      }

      // أثناء تحميل الجلسة يُحجز الإجراء وتُقرَّر حالته بعدها:
      // مسجّل → يُنفَّذ؛ زائر → مودال تسجيل الدخول ثم يُنفَّذ بعد الدخول
      authGuard.requireAuth(
        () => void performToggle(slug),
        {
          title: "سجّل دخولك لحفظ المحفوظات",
          message:
            "احفظ الصنايعية المفضلين لديك وسيتم مزامنتهم مع حسابك على كل أجهزتك.",
          actionDescription: "ستُحفظ الصنايعي في قائمة المحفوظات فور تسجيل الدخول.",
        },
      );
      return false;
    },
    [isLoggedIn, performToggle, authGuard],
  );

  const restoreFavorite = useCallback(
    (slug: string) => {
      setFavorite(slug, true);
      if (user?.id) {
        void addFavorite(user.id, slug).then((ok) => {
          if (!ok) {
            setFavorite(slug, false);
          }
        });
      }
    },
    [user],
  );

  return {
    favorites,
    count: favorites.length,
    isLoaded,
    isFavorite: (slug: string) => favoriteSet.has(slug),
    toggleFavorite,
    restoreFavorite,
    authOpen: authGuard.isOpen,
    authOptions: authGuard.guardOptions,
    onAuthClose: authGuard.handleClose,
    onAuthSuccess: authGuard.handleSuccess,
  };
}