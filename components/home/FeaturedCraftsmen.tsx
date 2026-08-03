import { getCategories, getFeaturedCraftsmen } from "@/lib/db/queries";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";

const INITIAL_SEED = 7;
const FEATURED_COUNT = 6;

export async function FeaturedCraftsmen() {
  const [items, categories] = await Promise.all([
    getFeaturedCraftsmen(FEATURED_COUNT, INITIAL_SEED),
    getCategories(),
  ]);

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((craftsman, index) => (
            <Reveal
              key={craftsman.id}
              delay={index * 60}
              className={index >= 6 ? "hidden lg:block" : ""}
            >
              <CraftsmanCard
                craftsman={craftsman}
                category={categoryBySlug.get(craftsman.category)}
                recent={craftsman.id === mostRecentId}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
