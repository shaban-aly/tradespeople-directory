import type { ReactNode } from "react";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";

export function CraftsmanGrid({
  craftsmen,
  categories = [],
  recentId,
  toolbar,
}: {
  craftsmen: Craftsman[];
  categories?: Category[];
  recentId?: string | null;
  toolbar?: ReactNode;
}) {
  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">{toolbar}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {craftsmen.map((craftsman, index) => (
          <CraftsmanCard
            key={craftsman.id}
            craftsman={craftsman}
            category={categoryBySlug.get(craftsman.category)}
            recent={craftsman.id === recentId}
            priority={index === 0}
          />
        ))}
      </div>
    </div>
  );
}