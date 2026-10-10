"use client";

import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { useCategoryDirectory } from "@/hooks/category/useCategoryDirectory";
import { CategorySearch } from "@/components/category/CategorySearch";
import { CategoryGrid } from "@/components/category/CategoryGrid";
import { CategoryEmptyState } from "@/components/category/CategoryEmptyState";

interface CategoryDirectoryProps {
  categories: CategoryWithCount[];
}

export function CategoryDirectory({ categories }: CategoryDirectoryProps) {
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    totalCount,
    activeCount,
    filteredCount,
    filteredCategories,
    clearFilters,
  } = useCategoryDirectory(categories);

  return (
    <div className="flex flex-col gap-8">
      {/* شريط البحث وتصفية التخصصات */}
      <CategorySearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalCount={totalCount}
        activeCount={activeCount}
        filteredCount={filteredCount}
      />

      {/* قائمة التخصصات أو حالة عدم وجود نتائج */}
      {filteredCount > 0 ? (
        <CategoryGrid categories={filteredCategories} />
      ) : (
        <CategoryEmptyState
          searchQuery={searchQuery}
          onReset={clearFilters}
        />
      )}
    </div>
  );
}
