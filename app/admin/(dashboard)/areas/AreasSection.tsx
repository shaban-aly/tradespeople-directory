"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AreaFormModal } from "@/components/admin/areas/AreaFormModal";
import { AreasTable } from "@/components/admin/areas/AreasTable";
import { IconPin, IconPlus } from "@/components/shared/icons";
import { useAdminAreas, type AdminAreasData } from "@/hooks/admin/useAdminAreas";

export function AreasSection({ initialData }: { initialData: AdminAreasData }) {
  const {
    areas,
    areaCounts,
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
  } = useAdminAreas(initialData);

  if (loading) return <DashboardLoading />;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="المناطق"
        description={`إدارة ${areas.length} منطقة في السويس.`}
        actions={
          <>
            <RefreshButton onRefresh={() => void refresh()} />
            <AdminButton
              type="button"
              onClick={() => setFormTarget("new")}
            >
              <IconPlus className="h-5 w-5" />
              إضافة منطقة
            </AdminButton>
          </>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-card">
        {areas.length === 0 ? (
          <EmptyState
            icon={<IconPin className="h-8 w-8" />}
            title="لا توجد مناطق"
            description="أضف أول منطقة ليتمكن الصنايعية من اختيارها."
          />
        ) : (
          <AreasTable
            areas={areas}
            counts={areaCounts}
            busyKey={busyKey}
            onEdit={setFormTarget}
            onToggle={handleToggle}
            onDelete={setDeleteTarget}
          />
        )}
      </section>

      <AreaFormModal
        target={formTarget}
        open={formTarget !== null}
        busy={busyKey === "add-area" || busyKey.startsWith("update-area-")}
        onClose={() => setFormTarget(null)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف المنطقة"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        confirmLabel="حذف المنطقة"
        danger
        busy={busyKey === `delete-area-${deleteTarget?.id}`}
      />
    </div>
  );
}