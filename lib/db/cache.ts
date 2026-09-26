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
  craftsmenList: "craftsmen:list",
  craftsmanSlug: (slug: string) => `craftsman:slug:${slug}`,
  categories: "categories",
  areas: "areas",
  stats: "stats",
} as const;
