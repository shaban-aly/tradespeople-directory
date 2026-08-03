import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { CategoryCard } from "@/components/home/CategoryCard";
import { Reveal } from "@/components/shared/ui/Reveal";

export function CategoryGrid({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {categories.map((category, index) => (
        <Reveal key={category.slug} delay={index * 60}>
          <CategoryCard category={category} />
        </Reveal>
      ))}
    </div>
  );
}
