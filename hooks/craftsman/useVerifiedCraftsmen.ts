import { useRef, useMemo } from "react";
import type { Category, Craftsman } from "@/lib/data/craftsmen";

export function useVerifiedCraftsmen(
  items: Craftsman[],
  categories: Category[]
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const mostRecentId = useMemo(() => {
    if (items.length === 0) return null;
    return items.reduce((a, b) => (a.addedAt > b.addedAt ? a : b)).id;
  }, [items]);

  const categoryBySlug = useMemo(() => {
    return new Map(categories.map((cat) => [cat.slug, cat]));
  }, [categories]);

  return {
    scrollRef,
    mostRecentId,
    categoryBySlug,
  };
}
