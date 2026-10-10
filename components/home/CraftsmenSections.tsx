import {
  getCategories,
  getVerifiedCraftsmen,
  getRecommendationPool,
  getCategoriesWithCounts,
  getStats,
} from "@/lib/db/queries";
import { RecommendationsSection } from "@/components/home/RecommendationsSection";
import { VerifiedCraftsmen } from "@/components/home/VerifiedCraftsmen";
import { CategoriesSidebar } from "@/components/home/CategoriesSidebar";

const VERIFIED_COUNT = 10;

export async function CraftsmenSections() {
  const [verified, pool, categories, categoriesWithCounts, stats] =
    await Promise.all([
      getVerifiedCraftsmen(VERIFIED_COUNT, 7),
      getRecommendationPool(40),
      getCategories(),
      getCategoriesWithCounts(),
      getStats(),
    ]);

  // استبعاد الموثقين من مجموعة الاقتراحات — القسمان لا يعرضان نفس الصنايعي أبداً
  const verifiedSlugs = new Set(verified.map((craftsman) => craftsman.slug));
  const suggestionsPool = pool.filter(
    (craftsman) => !verifiedSlugs.has(craftsman.slug),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-0 lg:px-4 lg:py-10">
      <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
        {/* سايدبار التصنيفات — يظهر فقط على شاشات الديسكتوب الكبيرة ملتصقاً أثناء التمرير */}
        <CategoriesSidebar
          categories={categoriesWithCounts}
          totalCategories={stats.categories}
          className="hidden lg:block"
        />

        {/* مساحة المحتوى الرئيسية للصنايعية الموثقين والمقترحات */}
        <div className="flex-1 min-w-0 w-full space-y-0 lg:space-y-12">
          <VerifiedCraftsmen items={verified} categories={categories} />
          <RecommendationsSection pool={suggestionsPool} categories={categories} />
        </div>
      </div>
    </div>
  );
}
