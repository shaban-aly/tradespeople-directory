"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CraftsmanForm } from "@/components/admin/CraftsmanForm";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { Modal } from "@/components/admin/Modal";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { CraftsmenFilters } from "@/components/admin/craftsmen/CraftsmenFilters";
import { CraftsmenTable } from "@/components/admin/craftsmen/CraftsmenTable";
import { IconPlus, IconUsers } from "@/components/shared/icons";
import {
  type CraftsmanInput,
  type CraftsmanRow,
} from "@/lib/db/admin";
import {
  filterCraftsmen,
  paginate,
  type CraftsmanFilter,
} from "@/lib/db/admin-selectors";
import { useAdminCraftsmen } from "@/hooks/admin/useAdminCraftsmen";
import { useToast } from "@/hooks/ui/useToast";

const PAGE_SIZE = 8;

export default function CraftsmenPage() {
  const { toast } = useToast();
  const {
    categories,
    areas,
    craftsmen,
    loading,
    error,
    busyKey,
    toggleCraftsmanVerified,
    toggleCraftsmanPublished,
    createCraftsman,
    updateCraftsman,
    deleteCraftsman,
    refresh,
  } = useAdminCraftsmen();
  const [filter, setFilter] = useState<CraftsmanFilter>({
    search: "",
    category: "all",
    published: "all",
    verified: "all",
  });
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<CraftsmanRow | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<CraftsmanRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const filtered = filterCraftsmen(craftsmen, filter);
  const { page: safePage, pageCount, pageItems } = paginate(filtered, page, PAGE_SIZE);

  if (loading) return <DashboardLoading />;

  async function handleSubmit(payload: CraftsmanInput): Promise<boolean> {
    if (formTarget === "new") {
      const ok = await createCraftsman(payload);
      if (ok) {
        toast("success", "تمت إضافة الصنايعي");
        setFormTarget(null);
      }
      return ok;
    }
    if (formTarget) {
      const ok = await updateCraftsman(formTarget.id, payload);
      if (ok) {
        toast("success", "تم حفظ التعديلات");
        setFormTarget(null);
      }
      return ok;
    }
    return false;
  }

  async function handleToggleVerified(craftsman: CraftsmanRow) {
    const ok = await toggleCraftsmanVerified(craftsman);
    if (ok) {
      toast("success", craftsman.verified ? "تم إلغاء التوثيق" : "تم توثيق الصنايعي");
    }
  }

  async function handleTogglePublished(craftsman: CraftsmanRow) {
    const ok = await toggleCraftsmanPublished(craftsman);
    if (ok) {
      toast("success", craftsman.is_published ? "تم إخفاء الصنايعي" : "تم نشر الصنايعي");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const ok = await deleteCraftsman(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف الصنايعي");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الصنايعية"
        description={`إدارة ${craftsmen.length} صنايعي في الدليل.`}
        actions={
          <>
            <RefreshButton onRefresh={() => void refresh()} />
            <button
              type="button"
              onClick={() => setFormTarget("new")}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-on-accent transition-colors hover:bg-accent/90"
            >
              <IconPlus className="h-5 w-5" />
              إضافة صنايعي
            </button>
          </>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <CraftsmenFilters
          filter={filter}
          categories={categories}
          onChange={(next) => {
            setFilter((prev) => ({ ...prev, ...next }));
            setPage(1);
          }}
        />

        {pageItems.length === 0 ? (
          <EmptyState
            icon={<IconUsers className="h-8 w-8" />}
            title="لا توجد نتائج"
            description="جرّب تغيير البحث أو الفلاتر، أو أضف صنايعي جديد."
          />
        ) : (
          <>
            <CraftsmenTable
              craftsmen={pageItems}
              busyKey={busyKey}
              onToggleVerified={(item) => void handleToggleVerified(item)}
              onTogglePublished={(item) => void handleTogglePublished(item)}
              onEdit={setFormTarget}
              onDelete={setDeleteTarget}
            />
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <Modal
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        title={formTarget === "new" ? "إضافة صنايعي" : "تعديل بيانات الصنايعي"}
      >
        <CraftsmanForm
          categories={categories}
          areas={areas}
          initial={formTarget === "new" ? null : formTarget}
          busy={
            busyKey === "create-craftsman" ||
            busyKey.startsWith("update-craftsman-")
          }
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف الصنايعي"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}" نهائياً؟ ستُحذف روابط السوشيال وصورة الصنايعي أيضاً.`}
        confirmLabel="حذف نهائي"
        danger
        busy={busyKey === `delete-craftsman-${deleteTarget?.id}`}
      />
    </div>
  );
}
