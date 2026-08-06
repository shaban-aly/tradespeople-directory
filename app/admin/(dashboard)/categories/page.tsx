"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { CategoriesTable } from "@/components/admin/categories/CategoriesTable";
import {
  CategoryFormModal,
  type CategoryFormValues,
} from "@/components/admin/categories/CategoryFormModal";
import { IconPlus, IconTags } from "@/components/shared/icons";
import type { CategoryRow } from "@/lib/db/admin";
import { useAdminCategories } from "@/hooks/admin/useAdminCategories";
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";

export default function CategoriesPage() {
  const { toast } = useToast();
  const {
    categories,
    categoryCounts,
    loading,
    error,
    busyKey,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    refresh,
  } = useAdminCategories();
  const [formTarget, setFormTarget] = useState<CategoryRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  if (loading) return <DashboardLoading />;

  async function handleSubmit(payload: CategoryFormValues): Promise<boolean> {
    if (formTarget === "new") {
      const ok = await addCategory(payload);
      if (ok) {
        toast("success", "تمت إضافة التخصص");
        setFormTarget(null);
      }
      return ok;
    }
    if (formTarget) {
      const ok = await updateCategory(formTarget.id, payload);
      if (ok) {
        toast("success", "تم حفظ تعديلات التخصص");
        setFormTarget(null);
      }
      return ok;
    }
    return false;
  }

  async function handleToggle(category: CategoryRow) {
    const ok = await toggleCategoryActive(category);
    if (ok) {
      toast("success", category.is_active ? "تم إخفاء التخصص" : "تم إظهار التخصص");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if ((categoryCounts[deleteTarget.slug] ?? 0) > 0) {
      toast(
        "error",
        `لا يمكن حذف تخصص عليه ${toArabicDigits(categoryCounts[deleteTarget.slug] ?? 0)} صنايعي`,
      );
      setDeleteTarget(null);
      return;
    }
    const ok = await deleteCategory(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف التخصص");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="التصنيفات"
        description={`إدارة ${categories.length} تخصص معروض في الموقع.`}
        actions={
          <>
            <RefreshButton onRefresh={() => void refresh()} />
            <button
              type="button"
              onClick={() => setFormTarget("new")}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
            >
              <IconPlus className="h-5 w-5" />
              إضافة تخصص
            </button>
          </>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        {categories.length === 0 ? (
          <EmptyState
            icon={<IconTags className="h-8 w-8" />}
            title="لا توجد تصنيفات"
            description="أضف أول تخصص ليظهر في الصفحة الرئيسية."
          />
        ) : (
          <CategoriesTable
            categories={categories}
            counts={categoryCounts}
            busyKey={busyKey}
            onEdit={setFormTarget}
            onToggle={(category) => void handleToggle(category)}
            onDelete={setDeleteTarget}
          />
        )}
      </section>

      <CategoryFormModal
        target={formTarget}
        open={formTarget !== null}
        busy={
          busyKey === "add-category" || busyKey.startsWith("update-category-")
        }
        onClose={() => setFormTarget(null)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف التخصص"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        confirmLabel="حذف التخصص"
        danger
        busy={busyKey === `delete-category-${deleteTarget?.id}`}
      />
    </div>
  );
}
