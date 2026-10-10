"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { CategoriesTable } from "@/components/admin/categories/CategoriesTable";
import { CategoryFormModal } from "@/components/admin/categories/CategoryFormModal";
import { IconPlus, IconTags } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import {
  useAdminCategories,
  type AdminCategoriesData,
} from "@/hooks/admin/useAdminCategories";

export function CategoriesSection({
  initialData,
}: {
  initialData: AdminCategoriesData;
}) {
  const {
    categories,
    categoryCounts,
    loading,
    busyKey,
    formTarget,
    setFormTarget,
    deleteTarget,
    setDeleteTarget,
    handleSubmit,
    handleToggle,
    handleDelete,
    refresh,
  } = useAdminCategories(initialData);

  if (loading) return <DashboardLoading />;

  const deleteTargetCount = deleteTarget
    ? (categoryCounts[deleteTarget.slug] ?? 0)
    : 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="التصنيفات"
        description={`إدارة ${toArabicDigits(categories.length)} تخصص معروض في الموقع.`}
        actions={
          <>
            <RefreshButton onRefresh={() => void refresh()} />
            <AdminButton
              type="button"
              onClick={() => setFormTarget("new")}
            >
              <IconPlus className="h-5 w-5" />
              إضافة تخصص
            </AdminButton>
          </>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-card">
        {categories.length === 0 ? (
          <EmptyState
            icon={<IconTags className="h-8 w-8" />}
            title="لا توجد تصنيفات"
            description="أضف أول تخصص ليظهر في الصفحة الرئيسية."
            action={
              <AdminButton
                type="button"
                onClick={() => setFormTarget("new")}
              >
                <IconPlus className="h-5 w-5" />
                إضافة تخصص
              </AdminButton>
            }
          />
        ) : (
          <CategoriesTable
            categories={categories}
            counts={categoryCounts}
            busyKey={busyKey}
            onEdit={setFormTarget}
            onToggle={handleToggle}
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
        onConfirm={() => {
          if (deleteTargetCount > 0) {
            setDeleteTarget(null);
            return;
          }
          void handleDelete();
        }}
        title={deleteTargetCount > 0 ? "تعذر حذف التخصص" : "حذف التخصص"}
        message={
          deleteTargetCount > 0
            ? `لا يمكن حذف تخصص "${deleteTarget?.name}" نظراً لوجود ${toArabicDigits(deleteTargetCount)} صنايعي مسجلين تحته. يرجى نقلهم أو تعديل تخصصاتهم أولاً.`
            : `هل أنت متأكد من حذف تخصص "${deleteTarget?.name}"؟ سيتم إزالته من الموقع نهائياً.`
        }
        confirmLabel={deleteTargetCount > 0 ? "حسناً، فهمت" : "حذف التخصص"}
        danger={deleteTargetCount === 0}
        busy={busyKey === `delete-category-${deleteTarget?.id}`}
      />
    </div>
  );
}