import Link from "next/link";
import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconArrow } from "@/components/shared/icons";
import { categoryColor } from "@/lib/utils/categoryColor";
import { categoryHref } from "@/lib/utils/url";

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  const color = categoryColor(category.slug);

  return (
    <Link
      href={categoryHref(category.slug)}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
    >
      <div
        className="rounded-lg p-2 transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
          color,
        }}
      >
        <CategoryIcon name={category.icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-heading text-base font-bold text-foreground">
          {category.name}
        </h3>
      </div>
      <IconArrow className="h-3.5 w-3.5 shrink-0 text-muted transition-colors group-hover:text-accent" />
    </Link>
  );
}
