"use client";

import type { ReactNode } from "react";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CraftsmanCard } from "@/components/shared/ui/CraftsmanCard";
import { ViewToggle } from "@/components/shared/ui/ViewToggle";
import { useViewPreference } from "@/hooks/useViewPreference";

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
  const { view, setView } = useViewPreference();
  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">{toolbar}</div>
        <ViewToggle view={view} onChange={setView} />
      </div>
      <div
        className={
          view === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-3"
        }
      >
        {craftsmen.map((craftsman) => (
          <CraftsmanCard
            key={craftsman.id}
            craftsman={craftsman}
            category={categoryBySlug.get(craftsman.category)}
            recent={craftsman.id === recentId}
            view={view}
          />
        ))}
      </div>
    </div>
  );
}
