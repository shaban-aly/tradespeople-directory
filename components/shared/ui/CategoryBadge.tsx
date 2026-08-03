import type { Category } from "@/lib/data/craftsmen";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">
      <CategoryIcon name={category.icon} className="h-3.5 w-3.5" />
      {category.name}
    </span>
  );
}
