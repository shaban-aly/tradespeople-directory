"use client";

import { useMemo } from "react";
import {
  createCategory,
  deleteCategory,
  fetchAdminBreakdownCounts,
  fetchCategories,
  fetchCounts,
  toggleCategoryActive,
  updateCategory,
  type CategoryIcon,
  type CategoryRow,
} from "@/lib/db/admin";
import { buildCategoryCounts } from "@/lib/db/admin-selectors";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export type CategoryPayload = {
  slug: string;
  name: string;
  icon: CategoryIcon;
};

export interface AdminCategoriesData {
  categories: CategoryRow[];
  counts?: Awaited<ReturnType<typeof fetchCounts>>;
  categoryCounts?: Record<string, number>;
}

export function useAdminCategories(initialData?: AdminCategoriesData) {
  const seeded = useMemo(() => {
    if (!initialData) return undefined;
    return {
      categories: initialData.categories,
      categoryCounts:
        initialData.categoryCounts ?? buildCategoryCounts(initialData.counts ?? []),
    };
  }, [initialData]);

  const { data, loading, error: loadError, refresh } = useAdminQuery(async () => {
    const [categories, breakdown] = await Promise.all([
      fetchCategories(),
      fetchAdminBreakdownCounts(),
    ]);
    return { categories, categoryCounts: breakdown.byCategory };
  }, seeded);
  const { busyKey, error: actionError, run } = useAdminAction();

  const categoryCounts = data?.categoryCounts ?? {};

  const addCategory = (payload: CategoryPayload) =>
    run("add-category", () => createCategory(payload, data?.categories ?? []), refresh);

  const updateCategoryItem = (id: string, payload: CategoryPayload) =>
    run(`update-category-${id}`, () => updateCategory(id, payload), refresh);

  const deleteCategoryItem = (id: string) =>
    run(`delete-category-${id}`, () => deleteCategory(id), refresh);

  const toggleCategoryActiveItem = (category: CategoryRow) =>
    run(`category-${category.id}`, () => toggleCategoryActive(category), refresh);

  return {
    categories: data?.categories ?? [],
    categoryCounts,
    loading,
    error: loadError || actionError,
    busyKey,
    addCategory,
    updateCategory: updateCategoryItem,
    deleteCategory: deleteCategoryItem,
    toggleCategoryActive: toggleCategoryActiveItem,
    refresh,
  };
}
