import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { CategoryCard } from "@/components/category/CategoryCard";
import { Reveal } from "@/components/shared/ui/Reveal";

interface CategoryGridProps {
  categories: CategoryWithCount[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {categories.map((category, index) => (
        <Reveal key={category.slug} delay={Math.min(index * 30, 300)}>
          <CategoryCard category={category} />
        </Reveal>
      ))}
    </div>
  );
}
