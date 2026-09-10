"use client";

import { useRef } from "react";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { CarouselIndicators } from "@/components/shared/ui/CarouselIndicators";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";
import { IconStar } from "@/components/shared/icons";

export function FeaturedCraftsmen({
  items,
  categories,
}: {
  items: Craftsman[];
  categories: Category[];
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (items.length === 0) return null;

  const mostRecentId = items.reduce((a, b) =>
    a.addedAt > b.addedAt ? a : b,
  ).id;

  const categoryBySlug = new Map(
    categories.map((cat) => [cat.slug, cat]),
  );

  return (
    <section id="featured" className="border-t border-border bg-card/40 py-16">
      <div className="mx-auto w-full max-w-5xl px-4">
        <Reveal>
          <SectionHeader
            icon={<IconStar className="h-4 w-4" />}
            eyebrow="صنايعية مميزين"
            title={
              <>
                أفضل الصنايعية في{" "}
                <span className="text-accent">الدليل</span>
              </>
            }
            description="عينة متنوعة من كل التخصصات — اختار الأقرب لك وكلمه على طول."
          />
        </Reveal>

        {/* Carousel على الموبايل — Grid 4 أعمدة على الديسكتوب */}
        <div ref={scrollRef} className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0 md:pb-0">
          <div className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {items.map((craftsman) => (
              <div
                key={craftsman.id}
                data-snap-card
                className="w-[72vw] max-w-65 shrink-0 snap-start sm:w-60 md:w-auto md:max-w-none"
              >
                <CraftsmanCard
                  craftsman={craftsman}
                  category={categoryBySlug.get(craftsman.category)}
                  recent={craftsman.id === mostRecentId}
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
