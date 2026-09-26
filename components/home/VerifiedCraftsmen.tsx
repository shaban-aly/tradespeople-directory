"use client";

import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { useVerifiedCraftsmen } from "@/hooks/useVerifiedCraftsmen";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { CarouselIndicators } from "@/components/shared/ui/CarouselIndicators";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";
import { IconShieldCheck } from "@/components/shared/icons";

export function VerifiedCraftsmen({
  items,
  categories,
}: {
  items: Craftsman[];
  categories: Category[];
}) {
  const { scrollRef, mostRecentId, categoryBySlug } = useVerifiedCraftsmen(
    items,
    categories
  );

  if (items.length === 0) return null;

  return (
    <section id="verified" className="border-t border-border bg-card/40 py-16">
      <div className="mx-auto w-full max-w-5xl px-4">
        <Reveal>
          <SectionHeader
            icon={<IconShieldCheck className="h-4 w-4" />}
            eyebrow="صنايعية موثوقين"
            title={
              <>
                صنايعية ببيانات{" "}
                <span className="text-accent">موثقة</span>
              </>
            }
            description="صنايعية تم مراجعة والتأكد من بياناتهم لضمان تجربة آمنة."
          />
        </Reveal>

        {/* Carousel على الموبايل — Grid 4 أعمدة على الديسكتوب */}
        <div ref={scrollRef} className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0 md:pb-0">
          <div className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {items.map((craftsman, index) => (
              <div
                key={craftsman.id}
                data-snap-card
                className="w-[72vw] max-w-65 shrink-0 snap-start sm:w-60 md:w-auto md:max-w-none"
              >
                <CraftsmanCard
                  craftsman={craftsman}
                  category={categoryBySlug.get(craftsman.category)}
                  recent={craftsman.id === mostRecentId}
                  priority={index < 4}
                />
              </div>
            ))}
          </div>
        </div>

        {/* مؤشرات التمرير (dots) — ظاهرة على الموبايل فقط */}
        <CarouselIndicators
          containerRef={scrollRef}
          count={items.length}
          className="md:hidden"
        />
      </div>
    </section>
  );
}
