"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { AreaFormModal } from "@/components/admin/areas/AreaFormModal";
import { AreasTable } from "@/components/admin/areas/AreasTable";
import { IconPin, IconPlus } from "@/components/shared/icons";
import type { AreaRow } from "@/lib/db/admin";
import { useAdminAreas } from "@/hooks/admin/useAdminAreas";
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";

export default function AreasPage() {
  const { toast } = useToast();
  const {
    areas,
    areaCounts,
    loading,
    error,
    busyKey,
    addArea,
    updateArea,
    deleteArea,
    toggleAreaActive,
    refresh,
  } = useAdminAreas();
  const [formTarget, setFormTarget] = useState<AreaRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AreaRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  if (loading) return <DashboardLoading />;

  async function handleSubmit(name: string): Promise<boolean> {
    if (formTarget === "new") {
      const ok = await addArea(name);
      if (ok) {
        toast("success", "تمت إضافة المنطقة");
        setFormTarget(null);
      }
      return ok;
    }
    if (formTarget) {
      const ok = await updateArea(formTarget.id, name);
      if (ok) {
        toast("success", "تم حفظ تعديلات المنطقة");
        setFormTarget(null);
      }
      return ok;
    }
    return false;
  }

  async function handleToggle(area: AreaRow) {
    const ok = await toggleAreaActive(area);
    if (ok) {
      toast("success", area.is_active ? "تم إخفاء المنطقة" : "تم إظهار المنطقة");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const count = areaCounts[deleteTarget.name] ?? 0;
    if (count > 0) {
      toast(
        "error",
        `لا يمكن حذف منطقة عليها ${toArabicDigits(count)} صنايعي`,
      );
      setDeleteTarget(null);
      return;
    }
    const ok = await deleteArea(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف المنطقة");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="المناطق"
        description={`إدارة ${areas.length} منطقة في السويس.`}
        actions={
          <>
            <RefreshButton onRefresh={() => void refresh()} />
            <button
              type="button"
              onClick={() => setFormTarget("new")}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
            >
              <IconPlus className="h-5 w-5" />
              إضافة منطقة
            </button>
          </>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
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
            onToggle={(area) => void handleToggle(area)}
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
