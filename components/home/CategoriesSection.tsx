import { getHomeCategories, getStats } from "@/lib/db/queries";
import { homeCategoriesLimit } from "@/lib/data/site";
import { toArabicDigits } from "@/lib/utils/format";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Reveal } from "@/components/shared/ui/Reveal";
import { SectionHeader } from "@/components/shared/ui/SectionHeader";
import { IconGrid } from "@/components/shared/icons";

export async function CategoriesSection() {
  const [stats, categories] = await Promise.all([
    getStats(),
    getHomeCategories(homeCategoriesLimit),
  ]);

  return (
    <section
      id="categories"
      data-tour="home-categories"
      className="mx-auto w-full max-w-5xl px-4 pt-4 sm:pt-8 pb-14 sm:pb-20"
    >
      <Reveal>
        <SectionHeader
          icon={<IconGrid className="h-4 w-4" />}
          eyebrow={`التصنيفات · ${toArabicDigits(stats.categories)} تخصص`}
          title={
            <>
              إيه التخصص اللي{" "}
              <span className="text-accent">محتاجه</span>{" "}
              النهارده؟
            </>
          }
          description="تصفح أبرز المهن والخدمات المتاحة في السويس واطلب الصنايعي الموثوق بضغطة واحدة."
          action={{
            label: "كل التخصصات",
            href: "/categories",
            count: toArabicDigits(stats.categories),
            variant: "ghost",
          }}
        />
      </Reveal>

      <CategoryGrid categories={categories} />
    </section>
  );
}
