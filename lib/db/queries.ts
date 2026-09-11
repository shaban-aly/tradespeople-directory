import { unstable_cache } from "next/cache";
import { createServerReadClient } from "./client";
import { shuffle } from "../utils/format";
import type {
  Category,
  CategoryWithCount,
  Craftsman,
  CraftsmanSort,
  SocialLink,
  SocialPlatform,
} from "../data/craftsmen";
import { DATA_CACHE_KEYS, SEARCH_CACHE_KEYS, SEARCH_CACHE_REVALIDATE, SEARCH_TAG } from "./cache";
import { matchScore, matchesQuery, normalizeArabic, type SearchData } from "../search";

const CRAFTSMAN_SELECT =
  "id, slug, name, image_url, phone, whatsapp, description, verified, added_at, category:categories(slug, name, icon), area:areas(name)";
const CRAFTSMAN_BY_CATEGORY_SELECT =
  "id, slug, name, image_url, phone, whatsapp, description, verified, added_at, category:categories!inner(slug, name, icon), area:areas(name), stats:craftsman_stats(views, calls, whatsapp)";

type CategoryRow = { slug: string; name: string; icon: string };
type AreaRow = { name: string };
type RatingSummaryRow = {
  craftsman_id: string;
  average_rating: number;
  total_reviews: number;
};

type CraftsmanRow = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  verified: boolean;
  added_at: string;
  category: CategoryRow | null;
  area: AreaRow | null;
};

function mapCraftsman(row: CraftsmanRow): Craftsman {
  return {
    id: row.id,
    slug: row.slug,
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

async function getSocialLinksImpl(craftsmanId: string): Promise<SocialLink[]> {
  const { data, error } = await createServerReadClient()
    .from("social_links")
    .select("platform, url")
    .eq("craftsman_id", craftsmanId)
    .order("created_at");
  assertSelectOk("روابط السوشيال", error);
  return (data ?? []).map((r) => ({ platform: r.platform as SocialPlatform, url: r.url }));
}

const getSocialLinks = unstable_cache(getSocialLinksImpl, [
  "data-craftsman-social-links",
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

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
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

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

export const getCategoryBySlug = unstable_cache(getCategoryBySlugImpl, [
  "data-category-by-slug",
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

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
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

async function getCraftsmanBySlugImpl(slug: string): Promise<Craftsman | undefined> {
  const { data, error } = await createServerReadClient()
    .from("craftsmen")
    .select(CRAFTSMAN_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  assertSelectOk("بيانات الصنايعي", error);
  if (!data) return undefined;
  const socialLinks = await getSocialLinks(data.id);
  return { ...mapCraftsman(data), socialLinks };
}

export const getCraftsmanBySlug = unstable_cache(getCraftsmanBySlugImpl, [
  "data-craftsman-by-slug",
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

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

export const getCraftsmenByCategory = unstable_cache(getCraftsmenByCategoryImpl, [
  "data-craftsmen-by-category",
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const [categories, craftsmen] = await Promise.all([getCategories(), getCraftsmen()]);
  return categories.map((category) => ({
    ...category,
    count: craftsmen.filter((c) => c.category === category.slug).length,
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
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

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
  const { data, error } = await createServerReadClient()
    .from("craftsmen")
    .select(`${CRAFTSMAN_SELECT}, stats:craftsman_stats(views, calls, whatsapp)`)
    .eq("is_published", true);

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
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

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
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

/** صف نتيجة دالة `get_related_craftsmen` (توصية تعاونية من أحداث الجلسات). */
type RelatedCraftsmanRow = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  verified: boolean;
  added_at: string;
  category_slug: string;
  category_name: string;
  category_icon: string;
  area_name: string;
  co_count: number;
};

function mapRelatedRow(row: RelatedCraftsmanRow): Craftsman {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category_slug,
    image: row.image_url ?? "",
    phone: row.phone,
    whatsapp: row.whatsapp ?? "",
    area: row.area_name ?? "",
    description: row.description ?? "",
    verified: row.verified,
    rating: { average: 0, totalReviews: 0 },
    addedAt: row.added_at,
  };
}

/**
 * «من شاف كمان»: صنايعية تفاعلت معهم نفس جلسات هذا الصنايعي (collaborative filtering).
 * تعتمد على دالة `get_related_craftsmen` في القاعدة — إن لم تكن مثبّتة أو
 * لم توجد بيانات بعد، ترجع قائمة فارغة بأمان.
 */
async function getRelatedByCoEngagementImpl(
  craftsmanId: string,
  limit = 6,
): Promise<Craftsman[]> {
  const { data, error } = await createServerReadClient().rpc("get_related_craftsmen", {
    p_craftsman_id: craftsmanId,
    p_limit: limit,
  });
  if (error || !data || data.length === 0) return [];
  return attachRatings(data.map(mapRelatedRow));
}

export const getRelatedByCoEngagement = unstable_cache(
  getRelatedByCoEngagementImpl,
  ["data-related-craftsmen"],
  { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] },
);

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
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

async function searchCraftsmenImpl(
  query: string,
  category: string,
  area: string,
  sort: CraftsmanSort,
): Promise<Craftsman[]> {
  const all = await getCraftsmen();
  const q = normalizeArabic(query);

  let result = all;
  if (q) {
    result = result.filter((craftsman) =>
      matchesQuery(q, craftsman.name, craftsman.category, craftsman.area, craftsman.description),
    );
  }
  if (category) {
    result = result.filter((craftsman) => craftsman.category === category);
  }
  if (area) {
    result = result.filter((craftsman) => craftsman.area === area);
  }

  return [...result].sort((a, b) => {
    if (sort === "verified" && a.verified !== b.verified) {
      return Number(b.verified) - Number(a.verified);
    }
    if (q) {
      const scoreDiff = matchScore(q, b.name) - matchScore(q, a.name);
      if (scoreDiff !== 0) return scoreDiff;
    }
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });
}

export const searchCraftsmen = unstable_cache(searchCraftsmenImpl, [
  SEARCH_CACHE_KEYS.craftsmen,
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });
