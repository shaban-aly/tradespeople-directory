import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CraftsmanGrid } from "@/components/shared/ui/CraftsmanGrid";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";

export function FeaturedCraftsmen({
  items,
  categories,
}: {
  items: Craftsman[];
  categories: Category[];
}) {
  const mostRecentId = items.length
    ? items.reduce((a, b) => (a.addedAt > b.addedAt ? a : b)).id
    : null;

  return (
    <section
      id="featured"
      className="border-t border-border bg-card/40 py-16"
    >
      <div className="mx-auto w-full max-w-5xl px-4">
        <Reveal>
          <SectionHeader
            eyebrow="صنايعية مميزين"
            title="أفضل الصنايعية في الدليل"
            description="عينة متنوعة من كل التخصصات — اختار الأقرب لك وكلمه على طول."
          />
        </Reveal>
        <CraftsmanGrid
          craftsmen={items}
          categories={categories}
          recentId={mostRecentId}
        />
      </div>
    </section>
  );
}
