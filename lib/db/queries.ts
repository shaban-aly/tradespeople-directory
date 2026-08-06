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
  "id, slug, name, image_url, phone, whatsapp, description, verified, added_at, category:categories!inner(slug, name, icon), area:areas(name)";

type CategoryRow = { slug: string; name: string; icon: string };
type AreaRow = { name: string };
type SocialLinkRow = { platform: SocialPlatform; url: string };

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
    addedAt: row.added_at,
  };
}

function mapCategory(row: CategoryRow): Category {
  return { slug: row.slug, name: row.name, icon: row.icon };
}

async function getSocialLinks(craftsmanId: string): Promise<SocialLink[]> {
  const { data } = (await createServerReadClient()
    .from("social_links")
    .select("platform, url")
    .eq("craftsman_id", craftsmanId)
    .order("created_at")) as { data: SocialLinkRow[] | null };
  return (data ?? []).map((r) => ({ platform: r.platform, url: r.url }));
}

async function getCategoriesImpl(): Promise<Category[]> {
  const { data } = (await createServerReadClient()
    .from("categories")
    .select("slug, name, icon")
    .eq("is_active", true)
    .order("sort_order")) as { data: CategoryRow[] | null };
  return (data ?? []).map(mapCategory);
}

export const getCategories = unstable_cache(getCategoriesImpl, [
  DATA_CACHE_KEYS.categories,
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const { data } = (await createServerReadClient()
    .from("categories")
    .select("slug, name, icon")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()) as { data: CategoryRow | null };
  return data ? mapCategory(data) : undefined;
}

async function getCraftsmenImpl(): Promise<Craftsman[]> {
  const { data } = (await createServerReadClient()
    .from("craftsmen")
    .select(CRAFTSMAN_SELECT)
    .eq("is_published", true)
    .order("added_at", { ascending: false })) as { data: CraftsmanRow[] | null };
  return (data ?? []).map(mapCraftsman);
}

export const getCraftsmen = unstable_cache(getCraftsmenImpl, [
  DATA_CACHE_KEYS.craftsmen,
], { revalidate: SEARCH_CACHE_REVALIDATE, tags: [SEARCH_TAG] });

export async function getCraftsmanBySlug(slug: string): Promise<Craftsman | undefined> {
  const { data } = (await createServerReadClient()
    .from("craftsmen")
    .select(CRAFTSMAN_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()) as { data: CraftsmanRow | null };
  if (!data) return undefined;
  const socialLinks = await getSocialLinks(data.id);
  return { ...mapCraftsman(data), socialLinks };
}

export async function getCraftsmenByCategory(slug: string): Promise<Craftsman[]> {
  const { data } = (await createServerReadClient()
    .from("craftsmen")
    .select(CRAFTSMAN_BY_CATEGORY_SELECT)
    .eq("is_published", true)
    .eq("category.slug", slug)
    .order("added_at", { ascending: false })) as { data: CraftsmanRow[] | null };
  return (data ?? []).map(mapCraftsman);
}

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
  const { data } = (await createServerReadClient()
    .from("areas")
    .select("name")
    .eq("is_active", true)
    .order("sort_order")) as { data: AreaRow[] | null };
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

type FeaturedRow = CraftsmanRow & { stats: StatsRow | null };

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
  const { data } = (await createServerReadClient()
    .from("craftsmen")
    .select(`${CRAFTSMAN_SELECT}, stats:craftsman_stats(views, calls, whatsapp)`)
    .eq("is_published", true)) as { data: FeaturedRow[] | null };

  const ranked: RankedCraftsman[] = (data ?? []).map((row) => ({
    id: row.id,
    craftsman: mapCraftsman(row),
    stats: row.stats ?? { views: 0, calls: 0, whatsapp: 0 },
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
  const { data } = (await createServerReadClient()
    .from("craftsmen")
    .select(`${CRAFTSMAN_SELECT}, stats:craftsman_stats(views, calls, whatsapp)`)
    .eq("is_published", true)
    .limit(limit)) as { data: FeaturedRow[] | null };

  return (data ?? []).map((row) => ({
    ...mapCraftsman(row),
    stats: row.stats ?? { views: 0, calls: 0, whatsapp: 0 },
  }));
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
    addedAt: row.added_at,
  };
}

/**
 * «من شاف كمان»: صنايعية تفاعلت معهم نفس جلسات هذا الصنايعي (collaborative filtering).
 * تعتمد على دالة `get_related_craftsmen` في القاعدة — إن لم تكن مثبّتة أو
 * لم توجد بيانات بعد، ترجع قائمة فارغة بأمان.
 */
export async function getRelatedByCoEngagement(
  craftsmanId: string,
  limit = 6,
): Promise<Craftsman[]> {
  const { data, error } = await (
    createServerReadClient() as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: RelatedCraftsmanRow[] | null; error: { message: string } | null }>;
    }
  ).rpc("get_related_craftsmen", {
    p_craftsman_id: craftsmanId,
    p_limit: limit,
  });
  if (error || !data || data.length === 0) return [];
  return data.map(mapRelatedRow);
}

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
