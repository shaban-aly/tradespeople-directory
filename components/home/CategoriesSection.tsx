import { getHomeCategories, getStats } from "@/lib/db/queries";
import { homeCategoriesLimit } from "@/lib/data/site";
import { toArabicDigits } from "@/lib/utils/format";
import { ButtonLink } from "@/components/shared/ui/Button";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";

export async function CategoriesSection() {
  const [stats, categories] = await Promise.all([
    getStats(),
    getHomeCategories(homeCategoriesLimit),
  ]);

  return (
    <section id="categories" className="mx-auto w-full max-w-5xl px-4 py-16">
      <Reveal>
        <SectionHeader
          eyebrow={`التصنيفات · ${toArabicDigits(stats.categories)}`}
          title="إيه اللي محتاجه النهارده؟"
          description="اختار التخصص و اوصّل للصنايعي المناسب في خطوتين."
        />
      </Reveal>
      <CategoryGrid categories={categories} />
      <Reveal>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/categories" variant="primary">
            كل التصنيفات
            <span className="text-on-accent/80">{toArabicDigits(stats.categories)}</span>
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
