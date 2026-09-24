"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { CraftsmanForm } from "@/components/admin/CraftsmanForm";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { Modal } from "@/components/admin/Modal";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { CraftsmenFilters } from "@/components/admin/craftsmen/CraftsmenFilters";
import { CraftsmenTable } from "@/components/admin/craftsmen/CraftsmenTable";
import { LinkAccountModal } from "@/components/admin/craftsmen/LinkAccountModal";
import { IconPlus, IconUsers } from "@/components/shared/icons";
import { type CraftsmanFilter } from "@/lib/db/admin-selectors";
import { useAdminCraftsmen, type AdminCraftsmenData } from "@/hooks/admin/useAdminCraftsmen";
import { useToast } from "@/hooks/ui/useToast";

export function CraftsmenSection({
  initialData,
  initialFilter,
  initialPagination,
}: {
  initialData: AdminCraftsmenData;
  initialFilter?: CraftsmanFilter;
  initialPagination?: {
    page: number;
    pageCount: number;
    totalCount: number;
  };
}) {
  const { toast } = useToast();
  const {
    categories,
    areas,
    pageItems,
    page,
    pageCount,
    totalDisplayCount,
    loading,
    busyKey,
    isPending,
    filter,
    formTarget,
    deleteTarget,
    linkTarget,
    setFormTarget,
    setDeleteTarget,
    setLinkTarget,
    handleFilterChange,
    handlePageChange,
    handleSubmit,
    handleToggleVerified,
    handleTogglePublished,
    handleDelete,
    refresh,
  } = useAdminCraftsmen({ initialData, initialFilter, initialPagination });

  if (loading) return <DashboardLoading />;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الصنايعية"
        description={`إدارة ${totalDisplayCount} صنايعي في الدليل.`}
        actions={
          <>
            <RefreshButton onRefresh={refresh} />
            <AdminButton
              type="button"
              onClick={() => setFormTarget("new")}
            >
              <IconPlus className="h-5 w-5" />
              إضافة صنايعي
            </AdminButton>
          </>
        }
      />

      <section
        className={`grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition-opacity duration-200 ${
          isPending ? "opacity-60 pointer-events-none" : "opacity-100"
        }`}
      >
        <CraftsmenFilters
          filter={filter}
          categories={categories}
          onChange={handleFilterChange}
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
              onLinkAccount={setLinkTarget}
              onView={(slug) => window.open(`/craftsman/${slug}`, "_blank")}
            />
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>

      <LinkAccountModal
        craftsman={linkTarget}
        isOpen={linkTarget !== null}
        onClose={() => setLinkTarget(null)}
        onSuccess={() => {
          toast("success", "تم ربط حساب الفني بنجاح!");
          refresh();
        }}
      />

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