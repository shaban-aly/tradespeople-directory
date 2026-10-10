import { useState, useMemo } from "react";
import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { normalizeArabic } from "@/lib/search";

export type CategoryFilterType = "all" | "active";

export function useCategoryDirectory(categories: CategoryWithCount[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CategoryFilterType>("all");

  const totalCount = categories.length;
  const activeCount = useMemo(
    () => categories.filter((c) => (c.count ?? 0) > 0).length,
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const query = normalizeArabic(searchQuery.trim().toLowerCase());

    return categories.filter((category) => {
      // 1. تصفية التخصصات النشطة إن كانت مفعلة
      if (activeFilter === "active" && (category.count ?? 0) <= 0) {
        return false;
      }

      // 2. تصفية البحث بالاسم أو المرادفات
      if (!query) return true;

      const nameNorm = normalizeArabic(category.name || "");
      const singularNorm = normalizeArabic(category.singular_name || "");
      const pluralNorm = normalizeArabic(category.plural_name || "");
      const slugNorm = category.slug.toLowerCase();

      return (
        nameNorm.includes(query) ||
        singularNorm.includes(query) ||
        pluralNorm.includes(query) ||
        slugNorm.includes(query)
      );
    });
  }, [categories, searchQuery, activeFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
  };

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    totalCount,
    activeCount,
    filteredCount: filteredCategories.length,
    filteredCategories,
    clearFilters,
  };
}
