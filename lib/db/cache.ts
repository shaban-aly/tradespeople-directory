import { unstable_cache } from "next/cache";

/**
 * التحديث بناءً على الأحداث فقط — لا تحديث دوري.
 * Supabase Webhook يستدعي /api/webhooks/supabase فور أي تغيير في البيانات.
 * false = "ثابت حتى يُبطل يدوياً" في Next.js unstable_cache / route segment.
 */
export const SEARCH_CACHE_REVALIDATE = false as const;

export const SEARCH_TAG = "search";

export const SEARCH_CACHE_KEYS = {
  data: "search-data",
  craftsmen: "search-craftsmen",
} as const;

export const DATA_CACHE_KEYS = {
  categories: "data-categories",
  craftsmen: "data-craftsmen",
  areas: "data-areas",
  stats: "data-stats",
} as const;

export const CACHE_TAGS = {
  // ── بيانات الصنايعي (تتغير عند إضافة/تعديل/حذف) ──────────────
  /** القائمة الكاملة — للـ sitemap والبحث والرئيسية */
  allCraftsmen: "craftsmen:all",

  /** صنايعي واحد بالـ slug */
  craftsmanSlug: (slug: string) => `craftsman:slug:${slug}`,

  /** صنايعية تخصص واحد — مُبطَل عند تغيير صنايعي في هذا التخصص فقط */
  categoryList: (slug: string) => `craftsman:category:${slug}`,

  // ── بيانات الرئيسية (مُشتقة، مُبطَلة عند تغيير الصنايعي) ──────
  /** قسم "موثّقون" في الرئيسية */
  homeVerified: "home:verified",

  /** عدادات الرئيسية (عدد الصنايعية، التخصصات، المناطق) */
  homeStats: "home:stats",

  // ── التخصصات والمناطق (تتغير نادراً) ────────────────────────────
  categories: "categories",
  areas: "areas",

  // ── التقييمات (لكل صنايعي مستقلة) ───────────────────────────────
  craftsmanReviews: (craftsmanId: string) => `reviews:craftsman:${craftsmanId}`,

  // ── البحث ────────────────────────────────────────────────────────
  searchIndex: "search:index",

} as const;

export function makeKeyedCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  namespace: string,
  tagFor: (...args: TArgs) => string,
  extraTags: string[] = [],
) {
  const registry = new Map<string, ReturnType<typeof unstable_cache<typeof fn>>>();
  return async (...args: TArgs): Promise<TResult> => {
    const key = JSON.stringify(args);
    let cached = registry.get(key);
    if (!cached) {
      cached = unstable_cache(fn, [namespace, key], {
        revalidate: SEARCH_CACHE_REVALIDATE,
        tags: [tagFor(...args), ...extraTags],
      });
      registry.set(key, cached);
    }
    return cached(...args);
  };
}
