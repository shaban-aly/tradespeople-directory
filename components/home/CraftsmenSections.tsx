import { getCategories, getVerifiedCraftsmen, getRecommendationPool } from "@/lib/db/queries";
import { RecommendationsSection } from "@/components/home/RecommendationsSection";
import { VerifiedCraftsmen } from "@/components/home/VerifiedCraftsmen";

const VERIFIED_COUNT = 10;

export async function CraftsmenSections() {
  const [verified, pool, categories] = await Promise.all([
    getVerifiedCraftsmen(VERIFIED_COUNT, 7),
    getRecommendationPool(40),
    getCategories(),
  ]);

  // استبعاد الموثقين من مجموعة الاقتراحات — القسمان لا يعرضان نفس الصنايعي أبداً
  const verifiedSlugs = new Set(verified.map((craftsman) => craftsman.slug));
  const suggestionsPool = pool.filter(
    (craftsman) => !verifiedSlugs.has(craftsman.slug),
  );

  return (
    <>
      <VerifiedCraftsmen items={verified} categories={categories} />
      <RecommendationsSection pool={suggestionsPool} categories={categories} />
    </>
  );
}
