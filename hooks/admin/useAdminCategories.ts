"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";
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
  const { toast } = useToast();
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
  const error = loadError || actionError;

  const [formTarget, setFormTarget] = useState<CategoryRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const rawCategories = data?.categories ?? [];
  const categoryCounts = data?.categoryCounts ?? {};

  const addCategory = (payload: CategoryPayload) =>
    run("add-category", () => createCategory(payload, rawCategories), refresh);

  const updateCategoryItem = (id: string, payload: CategoryPayload) =>
    run(`update-category-${id}`, () => updateCategory(id, payload), refresh);

  const deleteCategoryItem = (id: string) =>
    run(`delete-category-${id}`, () => deleteCategory(id), refresh);

  const toggleCategoryActiveItem = (category: CategoryRow) =>
    run(`category-${category.id}`, () => toggleCategoryActive(category), refresh);

  const handleSubmit = async (payload: CategoryPayload): Promise<boolean> => {
    if (formTarget === "new") {
      const ok = await addCategory(payload);
      if (ok) {
        toast("success", "تمت إضافة التخصص");
        setFormTarget(null);
      }
      return ok;
    }
    if (formTarget) {
      const ok = await updateCategoryItem(formTarget.id, payload);
      if (ok) {
        toast("success", "تم حفظ تعديلات التخصص");
        setFormTarget(null);
      }
      return ok;
    }
    return false;
  };

  const handleToggle = async (category: CategoryRow) => {
    const ok = await toggleCategoryActiveItem(category);
    if (ok) {
      toast("success", category.is_active ? "تم إخفاء التخصص" : "تم إظهار التخصص");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const count = categoryCounts[deleteTarget.slug] ?? 0;
    if (count > 0) {
      toast(
        "error",
        `لا يمكن حذف تخصص عليه ${toArabicDigits(count)} صنايعي`,
      );
      setDeleteTarget(null);
      return;
    }
    const ok = await deleteCategoryItem(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف التخصص");
      setDeleteTarget(null);
    }
  };

  return {
    categories: rawCategories,
    categoryCounts,
    loading,
    error,
    busyKey,
    formTarget,
    setFormTarget,
    deleteTarget,
    setDeleteTarget,
    handleSubmit,
    handleToggle,
    handleDelete,
    addCategory,
    updateCategory: updateCategoryItem,
    deleteCategory: deleteCategoryItem,
    toggleCategoryActive: toggleCategoryActiveItem,
    refresh,
  };
}
