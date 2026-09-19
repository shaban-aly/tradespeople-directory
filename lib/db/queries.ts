import { unstable_cache } from "next/cache";
import { createServerReadClient } from "./client";
import { shuffle } from "../utils/format";
import type {
  Category,
  CategoryWithCount,
  Craftsman,
  CraftsmanSort,
  SocialLink,
} from "../data/craftsmen";
import { CACHE_TAGS, DATA_CACHE_KEYS, SEARCH_CACHE_KEYS, SEARCH_CACHE_REVALIDATE, SEARCH_TAG } from "./cache";
import { matchScore, matchesQuery, normalizeArabic, type SearchData } from "../search";

const CRAFTSMAN_SELECT =
  "id, slug, name, image_url, phone, whatsapp, description, verified, added_at, updated_at, social_links, category:categories(slug, name, icon), area:areas(name)";
const CRAFTSMAN_BY_CATEGORY_SELECT =
  "id, slug, name, image_url, phone, whatsapp, description, verified, added_at, updated_at, social_links, category:categories!inner(slug, name, icon), area:areas(name), stats:craftsman_stats(views, calls, whatsapp)";

/**
 * غلاف يكش لكل مماثلة (slug...) نسخة كاش منفصلة بمفتاح ووسم خاصين بها
 * (`craftsman:slug:<slug>`)، بحيث يمكن إبطال صفحة صنايعي واحدة دون المساس
 * بوسوم quint العامة. `unstable_cache` يثبّت الوسوم وقت الإنشاء، لذا ننشئ
 * نسخة لكل مفتاح ونعيد استعمالها من سجل داخلي (slug universe محصور من DB).
 */
function keyedCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  namespace: string,
  tagFor: (...args: TArgs) => string,
) {
  const registry = new Map<string, ReturnType<typeof unstable_cache<typeof fn>>>();
  return async (...args: TArgs): Promise<TResult> => {
    const key = JSON.stringify(args);
    let cached = registry.get(key);
    if (!cached) {
      cached = unstable_cache(fn, [namespace, key], {
        revalidate: SEARCH_CACHE_REVALIDATE,
        tags: [tagFor(...args), CACHE_TAGS.craftsmenList, CACHE_TAGS.stats, SEARCH_TAG],
      });
      registry.set(key, cached);
    }
    return cached(...args);
  };
}

type CategoryRow = { slug: string; name: string; icon: string };
type AreaRow = { name: string };
type RatingSummaryRow = {
  craftsman_id: string;
  average_rating: number;
  total_reviews: number;
};

type CraftsmanRow = {
  id: string;
  slug: string | null;
  name: string;
  image_url: string | null;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  verified: boolean;
  added_at: string;
  updated_at?: string | null;
  social_links: unknown;
  category: CategoryRow | null;
  area: AreaRow | null;
};

function mapCraftsman(row: CraftsmanRow): Craftsman {
  const rawSocialLinks = row.social_links;
  const socialLinks: SocialLink[] = Array.isArray(rawSocialLinks)
    ? (rawSocialLinks as Array<{ platform?: string; url?: string }>).filter(
        (item): item is SocialLink =>
          item != null &&
          typeof item.platform === "string" &&
          typeof item.url === "string",
      )
    : [];
  return {
    id: row.id,
    slug: row.slug ?? "",
    name: row.name,
    category: row.category?.slug ?? "",
    image: row.image_url ?? "",
    phone: row.phone,
    whatsapp: row.whatsapp ?? "",
    area: row.area?.name ?? "",
    description: row.description ?? "",
    verified: row.verified,
    rating: { average: 0, totalReviews: 0 },
    addedAt: row.added_at,
    updatedAt: row.updated_at ?? row.added_at,
    socialLinks,
  };
}

/**
 * التمييز بين «نجاح الاستعلام مع صفر صفوف» (حالة فارغة مشروعة) و«فشل الاستعلام».
 * خطأ Supabase لا يُبلع أبداً — يُرمى Error عربي، حتى لا تبدو أعطال RLS
 * كأنها «لا بيانات» أمام الزائر.
 */
function assertSelectOk(from: string, error: unknown): void {
  if (error) {
    throw new Error(`فشل تحميل ${from} — جرّب تاني بعد شوية`);
  }
}

async function attachRatings<T extends Craftsman>(craftsmen: T[]): Promise<T[]> {
  if (craftsmen.length === 0) return craftsmen;

  const { data, error } = await createServerReadClient()
    .from("craftsman_rating_summaries")
    .select("craftsman_id, average_rating, total_reviews")
    .in(
      "craftsman_id",
      craftsmen.map((craftsman) => craftsman.id),
    );
  assertSelectOk("ملخصات التقييم", error);
  const ratings = new Map(
    ((data ?? []) as RatingSummaryRow[]).map((row) => [
      row.craftsman_id,
      {
        average: Number(row.average_rating) || 0,
        totalReviews: Number(row.total_reviews) || 0,
      },
    ]),
  );

  return craftsmen.map((craftsman) => ({
    ...craftsman,
    rating: ratings.get(craftsman.id) ?? craftsman.rating,
  }));
}

function mapCategory(row: CategoryRow): Category {
  return { slug: row.slug, name: row.name, icon: row.icon };
}

async function getCategoriesImpl(): Promise<Category[]> {
  const { data, error } = await createServerReadClient()
    .from("categories")
    .select("slug, name, icon")
    .eq("is_active", true)
    .order("sort_order");
  assertSelectOk("التخصصات", error);
  return (data ?? []).map(mapCategory);
}

export const getCategories = unstable_cache(getCategoriesImpl, [
  DATA_CACHE_KEYS.categories,
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.categories, SEARCH_TAG] });

async function getCategoryBySlugImpl(slug: string): Promise<Category | undefined> {
  const { data, error } = await createServerReadClient()
    .from("categories")
    .select("slug, name, icon")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  assertSelectOk("التخصص", error);
  return data ? mapCategory(data) : undefined;
}

/**
 * جلب التخصص عبر الـ slug.
 * ملاحظة: تقوم unstable_cache في Next.js بتضمين وسائط الدالة (slug) تلقائياً
 * في مفتاح الكاش، لذا لكل slug كاش مستقل ومعزول.
 */
export const getCategoryBySlug = unstable_cache(getCategoryBySlugImpl, [
  "data-category-by-slug",
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.categories, SEARCH_TAG] });

async function getCraftsmenImpl(): Promise<Craftsman[]> {
  const { data, error } = await createServerReadClient()
    .from("craftsmen")
    .select(CRAFTSMAN_SELECT)
    .eq("is_published", true)
    .order("added_at", { ascending: false });
  assertSelectOk("الصنايعية", error);
  return attachRatings((data ?? []).map(mapCraftsman));
}

export const getCraftsmen = unstable_cache(getCraftsmenImpl, [
  DATA_CACHE_KEYS.craftsmen,
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.craftsmenList, CACHE_TAGS.stats, SEARCH_TAG] });

async function getCraftsmanBySlugImpl(slug: string): Promise<Craftsman | undefined> {
  let normalizedSlug = slug;
  try {
    normalizedSlug = decodeURIComponent(slug);
  } catch {
    // الاحتفاظ بالرابط الأصلي في حال تعذر فك التشفير
  }
  const { data, error } = await createServerReadClient()
    .from("craftsmen")
    .select(CRAFTSMAN_SELECT)
    .eq("slug", normalizedSlug)
    .eq("is_published", true)
    .maybeSingle();
  assertSelectOk("بيانات الصنايعي", error);
  if (!data) return undefined;
  return mapCraftsman(data);
}

export const getCraftsmanBySlug = keyedCache(
  getCraftsmanBySlugImpl,
  "data-craftsman-by-slug",
  (slug) => CACHE_TAGS.craftsmanSlug(slug),
);

async function getCraftsmenByCategoryImpl(slug: string): Promise<CraftsmanWithStats[]> {
  const { data, error } = await createServerReadClient()
    .from("craftsmen")
    .select(CRAFTSMAN_BY_CATEGORY_SELECT)
    .eq("is_published", true)
    .eq("category.slug", slug)
    .order("added_at", { ascending: false });
  assertSelectOk("صنايعية التخصص", error);
  const craftsmen = (data ?? []).map((row) => ({
    ...mapCraftsman(row),
    stats: row.stats ?? { views: 0, calls: 0, whatsapp: 0 },
  }));
  return attachRatings(craftsmen);
}

/**
 * جلب الصنايعية حسب التخصص مع الإحصائيات.
 * ملاحظة: تقوم unstable_cache بتضمين وسيط التخصص (slug) تلقائياً في مفتاح الكاش،
 * بينما وسوم الكاش (tags) تُستخدم للإبطال الشامل عند تحديث أي صنايعي أو تصنيف.
 */
export const getCraftsmenByCategory = unstable_cache(getCraftsmenByCategoryImpl, [
  "data-craftsmen-by-category",
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.craftsmenList, CACHE_TAGS.categories, CACHE_TAGS.stats, SEARCH_TAG] });

type CategoryCountRow = { slug: string; craftsman_count: number };

/**
 * أعداد الصنايعية المنشورين لكل تصنيف من view التجميع في القاعدة
 * (`craftsman_counts_by_category`) — لا يجلب كل الصنايعية لحساب العدادات.
 * تُرجع كائنًا صريحًا لا `Map` (قيمة unstable_cache قابلة للتسلسل)
 * لأن Data Cache في Next.js لا يحافظ على الـ Map عند التخزين/الاسترجاع.
 */
async function getCategoryCountsImpl(): Promise<Record<string, number>> {
  const { data, error } = await createServerReadClient()
    .from("craftsman_counts_by_category")
    .select("slug, craftsman_count");
  assertSelectOk("أعداد الصنايعية بالتصنيف", error);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as CategoryCountRow[]) {
    counts[row.slug] = Number(row.craftsman_count) || 0;
  }
  return counts;
}

export const getCategoryCounts = unstable_cache(getCategoryCountsImpl, [
  "data-category-counts-v2",
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.craftsmenList, CACHE_TAGS.categories, SEARCH_TAG] });

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const [categories, counts] = await Promise.all([getCategories(), getCategoryCounts()]);
  return categories.map((category) => ({
    ...category,
    count: counts[category.slug] ?? 0,
  }));
}

/** أول `limit` تصنيف فقط — للصفحة الرئيسية (الباقي في `/categories`). */
export async function getHomeCategories(limit: number): Promise<CategoryWithCount[]> {
  const categories = await getCategoriesWithCounts();
  return categories.slice(0, limit);
}

async function getAreasImpl(): Promise<string[]> {
  const { data, error } = await createServerReadClient()
    .from("areas")
    .select("name")
    .eq("is_active", true)
    .order("sort_order");
  assertSelectOk("المناطق", error);
  return (data ?? []).map((r) => r.name);
}

export const getAreas = unstable_cache(getAreasImpl, [
  DATA_CACHE_KEYS.areas,
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.areas, SEARCH_TAG] });

export async function getStats() {
  const [craftsmen, categories, areas] = await Promise.all([
    getCraftsmen(),
    getCategories(),
    getAreas(),
  ]);
  return {
    craftsmen: craftsmen.length,
    categories: categories.length,
    areas: areas.length,
  };
}

type StatsRow = { views: number; calls: number; whatsapp: number };

type RankedCraftsman = {
  id: string;
  craftsman: Craftsman;
  stats: StatsRow;
};

function engagement(item: RankedCraftsman) {
  return item.stats.calls + item.stats.whatsapp + item.stats.views;
}

function compareEngagement(a: RankedCraftsman, b: RankedCraftsman) {
  return (
    b.stats.calls - a.stats.calls ||
    b.stats.whatsapp - a.stats.whatsapp ||
    b.stats.views - a.stats.views ||
    Number(b.craftsman.verified) - Number(a.craftsman.verified) ||
    new Date(b.craftsman.addedAt).getTime() - new Date(a.craftsman.addedAt).getTime()
  );
}

function pickDiverse(items: RankedCraftsman[], count: number) {
  const first = items[0];
  if (!first) return [];
  const result: RankedCraftsman[] = [first];
  const seenCategories = new Set([first.craftsman.category]);
  const seenIds = new Set([first.id]);

  for (const item of items) {
    if (result.length >= count) break;
    if (!seenCategories.has(item.craftsman.category)) {
      seenCategories.add(item.craftsman.category);
      seenIds.add(item.id);
      result.push(item);
    }
  }
  for (const item of items) {
    if (result.length >= count) break;
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      result.push(item);
    }
  }
  return result;
}

async function getFeaturedCraftsmenImpl(
  count: number,
  seed?: number,
): Promise<Craftsman[]> {
  // نقيد الجلب بـ 80 مع ترتيب زمني لمنع الجلب اللامحدود مع نمو قاعدة البيانات،
  // مع الاحتفاظ بتنوع كافٍ لـ pickDiverse لاختيار الصنايعية الأكثر تفاعلاً
  const { data, error } = await createServerReadClient()
    .from("craftsmen")
    .select(`${CRAFTSMAN_SELECT}, stats:craftsman_stats(views, calls, whatsapp)`)
    .eq("is_published", true)
    .order("added_at", { ascending: false })
    .limit(80);

  assertSelectOk("الصنايعية المميزة", error);
  const rows = data ?? [];
  const craftsmen = await attachRatings(rows.map(mapCraftsman));
  const ranked: RankedCraftsman[] = craftsmen.map((craftsman, index) => ({
    id: craftsman.id,
    craftsman,
    stats: rows[index]?.stats ?? { views: 0, calls: 0, whatsapp: 0 },
  }));

  const hasEngagement = ranked.some((item) => engagement(item) > 0);

  // بلا تفاعل بعد: نرجع للسلوك السابق (عشوائي مع تنوع تخصصات)
  if (!hasEngagement) {
    const shuffled = shuffle(ranked, seed);
    return pickDiverse(shuffled, count).map((item) => item.craftsman);
  }

  // الأكثر اتصالاً أولاً، ثم تنوع تخصصات مع ميل للتفاعل الأعلى
  ranked.sort(compareEngagement);
  return pickDiverse(ranked, count).map((item) => item.craftsman);
}

export const getFeaturedCraftsmen = unstable_cache(getFeaturedCraftsmenImpl, [
  "featured-craftsmen",
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.craftsmenList, CACHE_TAGS.stats, SEARCH_TAG] });

/** صنايعي مع إحصائياته الحقيقية — مجموعة اقتراحات «مقترحات لك». */
export type CraftsmanWithStats = Craftsman & {
  stats: { views: number; calls: number; whatsapp: number };
};

async function getRecommendationPoolImpl(
  limit = 40,
): Promise<CraftsmanWithStats[]> {
  const { data, error } = await createServerReadClient()
    .from("craftsmen")
    .select(`${CRAFTSMAN_SELECT}, stats:craftsman_stats(views, calls, whatsapp)`)
    .eq("is_published", true)
    .order("added_at", { ascending: false })
    .limit(limit);

  assertSelectOk("مقترحات الصنايعية", error);
  const craftsmen = (data ?? []).map((row) => ({
    ...mapCraftsman(row),
    stats: row.stats ?? { views: 0, calls: 0, whatsapp: 0 },
  }));
  return attachRatings(craftsmen);
}

export const getRecommendationPool = unstable_cache(getRecommendationPoolImpl, [
  "recommendation-pool",
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.craftsmenList, CACHE_TAGS.stats, SEARCH_TAG] });

async function getSearchDataImpl(): Promise<SearchData> {
  const [categories, areas, craftsmen] = await Promise.all([
    getCategoriesWithCounts(),
    getAreas(),
    getCraftsmen(),
  ]);
  return {
    categories: categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      count: c.count,
    })),
    areas,
    craftsmen: craftsmen.map((c) => ({
      name: c.name,
      slug: c.slug,
      category: c.category,
      area: c.area,
      image: c.image,
      verified: c.verified,
    })),
  };
}

export const getSearchData = unstable_cache(getSearchDataImpl, [
  SEARCH_CACHE_KEYS.data,
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.categories, CACHE_TAGS.areas, CACHE_TAGS.craftsmenList, SEARCH_TAG] });

async function searchCraftsmenImpl(
  query: string,
  category: string,
  area: string,
  sort: CraftsmanSort,
): Promise<Craftsman[]> {
  const { data, error } = await createServerReadClient()
    .rpc("search_craftsmen", {
      p_query: query || "",
      p_category: category || "",
      p_area: area || "",
      p_sort: sort || "verified",
      p_limit: 80,
    });

  assertSelectOk("نتائج البحث", error);

  const rows = (data ?? []) as unknown as CraftsmanRow[];
  const craftsmen = rows.map(mapCraftsman);
  return attachRatings(craftsmen);
}

export const searchCraftsmen = unstable_cache(searchCraftsmenImpl, [
  SEARCH_CACHE_KEYS.craftsmen,
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [CACHE_TAGS.craftsmenList, SEARCH_TAG] });
