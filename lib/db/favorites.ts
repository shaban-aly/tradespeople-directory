import { createSupabase } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * كاش في الذاكرة لقوائم مفضلة المستخدمين لتفادي كثرة الاستعلامات
 */
const userFavoritesCache = new Map<string, { slugs: string[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // دقيقة واحدة

/**
 * كاش لمطابقة الـ slug بـ craftsman_id
 */
const slugToIdCache = new Map<string, string>();

/**
 * جلب معرف الفني (UUID) بواسطة الـ slug مع كاش في الذاكرة
 */
export async function getCraftsmanIdBySlug(slug: string): Promise<string | null> {
  if (slugToIdCache.has(slug)) {
    return slugToIdCache.get(slug)!;
  }

  const supabase = createSupabase();
  const { data, error } = await supabase
    .from("craftsmen")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  slugToIdCache.set(slug, data.id);
  return data.id;
}

/**
 * جلب مفضلات المستخدم المسجل من Supabase مع استغلال الكاش
 */
export async function getUserFavorites(userId: string): Promise<string[]> {
  const cached = userFavoritesCache.get(userId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.slugs;
  }

  const supabase = createSupabase();
  const { data, error } = await supabase
    .from("favorites")
    .select(`
      craftsman:craftsmen(slug)
    `)
    .eq("user_id", userId);

  if (error || !data) {
    return cached?.slugs ?? [];
  }

  const slugs = data
    .map((item) => {
      const craftsman = item.craftsman as unknown as { slug: string } | null;
      return craftsman?.slug;
    })
    .filter((slug): slug is string => Boolean(slug));

  userFavoritesCache.set(userId, { slugs, timestamp: now });
  return slugs;
}

/**
 * إضافة فني إلى مفضلة المستخدم في Supabase وتحديث الكاش
 */
export async function addFavorite(userId: string, craftsmanSlug: string): Promise<boolean> {
  // تحديث تفاؤلي في الكاش اللحظي
  const cached = userFavoritesCache.get(userId);
  if (cached && !cached.slugs.includes(craftsmanSlug)) {
    cached.slugs = [...cached.slugs, craftsmanSlug];
  } else if (!cached) {
    userFavoritesCache.set(userId, { slugs: [craftsmanSlug], timestamp: Date.now() });
  }

  const craftsmanId = await getCraftsmanIdBySlug(craftsmanSlug);
  if (!craftsmanId) {
    return false;
  }

  const supabase = createSupabase();
  const { error } = await supabase
    .from("favorites")
    .upsert(
      {
        user_id: userId,
        craftsman_id: craftsmanId,
      },
      { onConflict: "user_id,craftsman_id" }
    );

  return !error;
}

/**
 * حذف فني من مفضلة المستخدم في Supabase وتحديث الكاش
 */
export async function removeFavorite(userId: string, craftsmanSlug: string): Promise<boolean> {
  // تحديث تفاؤلي في الكاش اللحظي
  const cached = userFavoritesCache.get(userId);
  if (cached) {
    cached.slugs = cached.slugs.filter((s) => s !== craftsmanSlug);
  }

  const craftsmanId = await getCraftsmanIdBySlug(craftsmanSlug);
  if (!craftsmanId) {
    return false;
  }

  const supabase = createSupabase();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("craftsman_id", craftsmanId);

  return !error;
}

/**
 * جلب عدد مرات إضافة فني للمفضلة (للوحة التحكم وللصفحة) عبر دالة RPC
 */
export async function getCraftsmanFavoritesCount(
  craftsmanId: string,
  client: SupabaseClient<Database> = createSupabase(),
): Promise<number> {
  const { data, error } = await client.rpc("get_craftsman_favorites_count", {
    p_craftsman_id: craftsmanId,
  });

  if (error || typeof data !== "number") {
    return 0;
  }

  return data;
}

/**
 * إبطال كاش مفضلة المستخدم يدوياً
 */
export function invalidateUserFavoritesCache(userId?: string): void {
  if (userId) {
    userFavoritesCache.delete(userId);
  } else {
    userFavoritesCache.clear();
    slugToIdCache.clear();
  }
}
