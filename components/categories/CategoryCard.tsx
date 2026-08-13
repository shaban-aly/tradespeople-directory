import Link from "next/link";
import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconArrow } from "@/components/shared/icons";
import { categoryHref } from "@/lib/utils/url";

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  return (
    <Link
      href={categoryHref(category.slug)}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-accent/15 p-2.5 text-accent">
          <CategoryIcon name={category.icon} className="h-7 w-7" />
        </div>
        <IconArrow className="h-4 w-4 text-muted transition-colors group-hover:text-accent" />
      </div>
      <div>
        <h3 className="font-heading text-xl font-bold text-foreground">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}
