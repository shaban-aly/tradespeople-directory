"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { CarouselIndicators } from "@/components/shared/ui/CarouselIndicators";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";

// قسم «شاهد أيضاً» أسفل صفحة التفاصيل — نفس لغة كاروسيل الهوم:
// تمرير أفقي على الموبايل وشبكة على الديسكتوب بنفس منظر الكروت.
interface RelatedCraftsmenProps {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  icon?: ReactNode;
  craftsmen: Craftsman[];
  categories: Category[];
}

export function RelatedCraftsmen({
  id,
  eyebrow,
  title,
  description,
  icon,
  craftsmen,
  categories,
}: RelatedCraftsmenProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (craftsmen.length === 0) return null;

  const categoryBySlug = new Map(categories.map((cat) => [cat.slug, cat]));

  return (
    <section id={id} className="scroll-mt-24 border-t border-border bg-card/40 py-16">
      <div className="mx-auto w-full max-w-5xl px-4">
        <Reveal>
          <SectionHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            icon={icon}
          />
        </Reveal>

        {/* Carousel على الموبايل — شبكة على الديسكتوب (نفس نمط الهوم) */}
        <div
          ref={scrollRef}
          className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0 md:pb-0"
        >
          <div className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {craftsmen.map((craftsman) => (
              <div
                key={craftsman.id}
                data-snap-card
                className="w-[72vw] max-w-65 shrink-0 snap-start sm:w-60 md:w-auto md:max-w-none"
              >
                <CraftsmanCard
                  craftsman={craftsman}
                  category={categoryBySlug.get(craftsman.category)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* مؤشرات التمرير (dots) — ظاهرة على الموبايل فقط */}
        <CarouselIndicators
          containerRef={scrollRef}
          count={craftsmen.length}
          className="md:hidden"
        />
      </div>
    </section>
  );
}