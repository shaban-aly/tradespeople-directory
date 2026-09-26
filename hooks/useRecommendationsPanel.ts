import { useRef, useMemo } from "react";
import type { Category } from "@/lib/data/craftsmen";
import type { RecommendableCraftsman } from "@/lib/recommendations";
import { useRecommendations } from "@/hooks/useRecommendations";

export function useRecommendationsPanel(
  pool: RecommendableCraftsman[],
  categories: Category[]
) {
  const { ranked, isPersonalized } = useRecommendations(pool, 8);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const categoryBySlug = useMemo(() => {
    return new Map(categories.map((category) => [category.slug, category]));
  }, [categories]);

  return {
    ranked,
    isPersonalized,
    scrollRef,
    categoryBySlug,
  };
}
