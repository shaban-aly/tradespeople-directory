"use client";

import type { Category } from "@/lib/data/craftsmen";
import type { RecommendableCraftsman } from "@/lib/recommendations";
import { useRecommendations } from "@/hooks/useRecommendations";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";

export function RecommendationsPanel({
  pool,
  categories,
}: {
  pool: RecommendableCraftsman[];
  categories: Category[];
}) {
  const { ranked, hasHistory } = useRecommendations(pool, 8);

  if (ranked.length === 0) return null;

  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  return (
    <div>
      <SectionHeader
        eyebrow={hasHistory ? "بناءً على اختياراتك" : "اختيارات المجتمع"}
        title={hasHistory ? "مقترحات لك" : "الأكثر طلباً في السويس"}
        description={
          hasHistory
            ? "الصنايعية اللي تناسب اهتماماتك بناءً على تصفحك واختياراتك — كلمهم على طول."
            : "الصنايعية الأكثر تواصلاً من زوار الدليل — جرّبهم."
        }
      />
      <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0 md:pb-0">
        <div className="flex snap-x gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {ranked.map((craftsman) => (
            <div key={craftsman.id} className="w-60 shrink-0 snap-start md:w-auto">
              <CraftsmanCard
                craftsman={craftsman}
                category={categoryBySlug.get(craftsman.category)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
