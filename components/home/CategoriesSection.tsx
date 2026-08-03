import Link from "next/link";
import { getHomeCategories, getStats } from "@/lib/db/queries";
import { homeCategoriesLimit } from "@/lib/data/site";
import { toArabicDigits } from "@/lib/utils/format";
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
          <Link
            href="/categories"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-8 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
          >
            كل التصنيفات
            <span className="text-on-accent/80">{toArabicDigits(stats.categories)}</span>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
