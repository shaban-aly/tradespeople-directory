import { getCategories, getFeaturedCraftsmen, getRecommendationPool } from "@/lib/db/queries";
import { RecommendationsSection } from "@/components/home/RecommendationsSection";
import { FeaturedCraftsmen } from "@/components/home/FeaturedCraftsmen";

const FEATURED_COUNT = 8;

export async function CraftsmenSections() {
  const [featured, pool, categories] = await Promise.all([
    getFeaturedCraftsmen(FEATURED_COUNT, 7),
    getRecommendationPool(40),
    getCategories(),
  ]);

  // استبعاد المميزين من مجموعة الاقتراحات — القسمان لا يعرضان نفس الصنايعي أبداً
  const featuredSlugs = new Set(featured.map((craftsman) => craftsman.slug));
  const suggestionsPool = pool.filter(
    (craftsman) => !featuredSlugs.has(craftsman.slug),
  );

  return (
    <>
      <RecommendationsSection pool={suggestionsPool} categories={categories} />
      <FeaturedCraftsmen items={featured} categories={categories} />
    </>
  );
}
