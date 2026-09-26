"use client";

import type { Category } from "@/lib/data/craftsmen";
import type { RecommendableCraftsman } from "@/lib/recommendations";
import { useRecommendationsPanel } from "@/hooks/useRecommendationsPanel";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { CarouselIndicators } from "@/components/shared/ui/CarouselIndicators";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";
import { IconActivity } from "@/components/shared/icons";

export function RecommendationsPanel({
  pool,
  categories,
}: {
  pool: RecommendableCraftsman[];
  categories: Category[];
}) {
  const { ranked, isPersonalized, scrollRef, categoryBySlug } =
    useRecommendationsPanel(pool, categories);

  if (ranked.length === 0) return null;


  return (
    <div>
      <SectionHeader
        icon={<IconActivity className="h-4 w-4" />}
        eyebrow={isPersonalized ? "بناءً على اهتماماتك" : "اختيارات المجتمع"}
        title={
          isPersonalized ? (
            <>
              مقترحات{" "}
              <span className="text-accent">مخصصة لك</span>
            </>
          ) : (
            <>
              الأكثر{" "}
              <span className="text-accent">
                طلباً في السويس
              </span>
            </>
          )
        }
        description={
          isPersonalized
            ? "صنايعية تم ترشيحهم بناءً على تصفحك وبحثك — تواصل معهم مباشرة."
            : "الصنايعية الأكثر تواصلاً وطلباً من زوار الدليل في السويس."
        }
      />
      <div ref={scrollRef} className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0 md:pb-0">
        <div className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {ranked.map((craftsman) => (
            <div key={craftsman.id} data-snap-card className="w-[72vw] max-w-65 shrink-0 snap-start sm:w-60 md:w-auto md:max-w-none">
              <CraftsmanCard
                craftsman={craftsman}
                category={categoryBySlug.get(craftsman.category)}
                reason={craftsman.recommendationReason}
              />
            </div>
          ))}
        </div>
      </div>

      {/* مؤشرات التمرير — ظاهرة على الموبايل فقط */}
      <CarouselIndicators
        containerRef={scrollRef}
        count={ranked.length}
        className="md:hidden"
      />
    </div>
  );
}
