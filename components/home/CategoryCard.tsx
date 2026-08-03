import Link from "next/link";
import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconArrow } from "@/components/shared/icons";

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
    >
      <div className="rounded-lg bg-accent/15 p-2 text-accent">
        <CategoryIcon name={category.icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-heading text-base font-bold text-foreground">
          {category.name}
        </h3>
        <p className="truncate text-sm text-muted">
          {category.count} {category.count === 1 ? "صنايعي" : "صنايعية"}
        </p>
      </div>
      <IconArrow className="h-3.5 w-3.5 shrink-0 text-muted transition-colors group-hover:text-accent" />
    </Link>
  );
}
