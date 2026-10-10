"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminLeadCard } from "@/components/admin/leads/AdminLeadCard";
import { LeadDetailsDrawer } from "@/components/admin/leads/LeadDetailsDrawer";
import { LeadsFilters } from "@/components/admin/leads/LeadsFilters";
import { FilterTabs } from "@/components/shared/ui/FilterTabs";
import { IconInbox } from "@/components/shared/icons";
import {
  useAdminLeads,
  type AdminLeadsData,
} from "@/hooks/admin/useAdminLeads";
import type { LeadStatusFilter } from "@/lib/db/admin-selectors";
import { BULK_LEADS_LIMIT } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

const STATUS_TABS: { value: LeadStatusFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "open", label: "مفتوح" },
  { value: "claimed", label: "مستلم" },
  { value: "completed", label: "مكتمل" },
  { value: "expired", label: "منتهي" },
  { value: "cancelled", label: "ملغي" },
];

export function LeadsSection({ initialData }: { initialData: AdminLeadsData }) {
  const {
    categories,
    facets,
    filter,
    handleFilterChange,
    resetFilters,
    isFilterActive,
    fetching,
    filteredCount,
    pageItems,
    page,
    pageCount,
    handlePageChange,
    selectedIds,
    allOnPageSelected,
    toggleSelect,
    toggleSelectPage,
    clearSelection,
    bulkAction,
    setBulkAction,
    handleBulk,
    confirmExpired,
    setConfirmExpired,
    handleDeleteExpired,
    handleSelectAllResults,
    detailsLead,
    openDetails,
    setDetailsLead,
    deleteTarget,
    setDeleteTarget,
    hideTarget,
    setHideTarget,
    hideReason,
    setHideReason,
    handleDelete,
    handleHide,
    handleUnhide,
    responses,
    responsesLoading,
    loading,
    busyKey,
    refresh,
  } = useAdminLeads(initialData);

  if (loading) return <DashboardLoading />;

  const statusCount = (value: LeadStatusFilter) =>
    value === "all" ? facets.statusAll : facets.status[value];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="عروض العملاء (Leads)"
        description={`إجمالي ${toArabicDigits(facets.visibilityAll)} طلب مطابق للفلاتر (${toArabicDigits(facets.status.open)} مفتوح، ${toArabicDigits(facets.status.claimed)} مستلم).`}
        actions={<RefreshButton onRefresh={() => void refresh()} />}
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:p-6 shadow-card">
        {/* تبويبات الحالة — تلتف تلقائياً على الشاشات الضيقة فلا يُقص أي تبويب */}
        <div className="border-b border-border pb-4">
          <FilterTabs
            tabs={STATUS_TABS.map((tab) => ({
              ...tab,
              count: statusCount(tab.value),
            }))}
            active={filter.status}
            onChange={(status) => handleFilterChange({ status })}
          />
        </div>

        {/* بحث + تخصص + الرؤية (منيو دروب داون) + فرز */}
        <LeadsFilters
          filter={filter}
          categories={categories}
          facets={facets}
          onChange={handleFilterChange}
        />

        {/* شريط الإجراءات الجماعية */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/5 p-3">
            <span className="text-base font-bold text-foreground">
              تم تحديد {toArabicDigits(selectedIds.length)} طلب
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <AdminButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                إلغاء التحديد
              </AdminButton>
              <AdminButton
                type="button"
                variant="outlineWarning"
                size="sm"
                onClick={() => setBulkAction("hide")}
              >
                إخفاء المحدد
              </AdminButton>
              <AdminButton
                type="button"
                variant="outlineAction"
                size="sm"
                onClick={() => setBulkAction("unhide")}
              >
                إظهار المحدد
              </AdminButton>
              <AdminButton
                type="button"
                variant="dangerHover"
                size="sm"
                onClick={() => setBulkAction("delete")}
              >
                حذف المحدد
              </AdminButton>
            </div>
          </div>
        )}

        {filteredCount === 0 ? (
          <EmptyState
            icon={<IconInbox className="h-8 w-8" />}
            title="لا توجد طلبات تطابق الفلتر"
            description="جميع طلبات العملاء (Leads) التي ينشئونها ستظهر هنا."
            action={
              isFilterActive ? (
                <AdminButton type="button" variant="outline" size="sm" onClick={resetFilters}>
                  مسح الفلاتر
                </AdminButton>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectPage}
                >
                  {allOnPageSelected ? "إلغاء تحديد الصفحة" : "تحديد كل الصفحة"}
                </AdminButton>
                {filteredCount > pageItems.length && (
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busyKey === "select-all-results"}
                    onClick={() => void handleSelectAllResults()}
                  >
                    {filteredCount > BULK_LEADS_LIMIT
                      ? `تحديد أول ${toArabicDigits(BULK_LEADS_LIMIT)} نتيجة`
                      : `تحديد كل النتائج (${toArabicDigits(filteredCount)})`}
                  </AdminButton>
                )}
                {facets.status.expired > 0 && (
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger"
                    onClick={() => setConfirmExpired(true)}
                  >
                    حذف المنتهي ({toArabicDigits(facets.status.expired)})
                  </AdminButton>
                )}
              </div>
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                {fetching && (
                  <span
                    aria-hidden
                    className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent"
                  />
                )}
                {toArabicDigits(filteredCount)} نتيجة
              </span>
            </div>
            <div
              className={`grid gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3 ${fetching ? "pointer-events-none opacity-60" : ""}`}
            >
              {pageItems.map((lead) => (
                <AdminLeadCard
                  key={lead.id}
                  lead={lead}
                  busyKey={busyKey}
                  selected={selectedIds.includes(lead.id)}
                  onToggleSelect={(target) => toggleSelect(target.id)}
                  onHide={setHideTarget}
                  onUnhide={(target) => void handleUnhide(target)}
                  onDelete={setDeleteTarget}
                  onDetails={(target) => void openDetails(target)}
                />
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} onPageChange={handlePageChange} />
          </>
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف الطلب"
        message={
          deleteTarget
            ? `هل أنت متأكد من حذف طلب "${deleteTarget.category?.name || "العميل"}" (${deleteTarget.customer_phone}) نهائياً؟ سيتم إرسال إشعار للعميل بذلك. لا يمكن التراجع عن هذا القرار.`
            : "هل أنت متأكد من حذف هذا الطلب نهائياً؟ سيتم إرسال إشعار للعميل بذلك. لا يمكن التراجع عن هذا القرار."
        }
        confirmLabel="حذف الطلب"
        danger
        busy={busyKey === `delete-lead-${deleteTarget?.id}`}
      />

      <ConfirmDialog
        open={hideTarget !== null}
        onClose={() => {
          setHideTarget(null);
          setHideReason("");
        }}
        onConfirm={() => void handleHide()}
        title="إخفاء الطلب"
        message={
          hideTarget
            ? `هل أنت متأكد من إخفاء طلب "${hideTarget.category?.name || "العميل"}"؟ لن يظهر في لوحات تحكم الفنيين بعد الآن.`
            : "هل أنت متأكد من إخفاء هذا الطلب؟ لن يظهر في لوحات تحكم الفنيين بعد الآن."
        }
        confirmLabel="إخفاء الطلب"
        busy={busyKey === `hide-lead-${hideTarget?.id}`}
        note={{
          label: "سبب الإخفاء (اختياري — للمشرفين فقط)",
          placeholder: "مثال: وصف غير واضح، رقم ناقص...",
          value: hideReason,
          onChange: setHideReason,
          maxLength: 500,
        }}
      />

      <ConfirmDialog
        open={bulkAction !== null}
        onClose={() => setBulkAction(null)}
        onConfirm={() => void handleBulk()}
        title={bulkAction === "delete" ? "حذف الطلبات المحددة" : bulkAction === "hide" ? "إخفاء الطلبات المحددة" : "إظهار الطلبات المحددة"}
        message={
          bulkAction === "delete"
            ? `هل أنت متأكد من حذف ${toArabicDigits(selectedIds.length)} طلب نهائياً؟ سيتم إشعار أصحابها. لا يمكن التراجع عن هذا القرار.`
            : bulkAction === "hide"
              ? `هل أنت متأكد من إخفاء ${toArabicDigits(selectedIds.length)} طلب؟ لن تظهر في لوحات تحكم الفنيين.`
              : `هل أنت متأكد من إظهار ${toArabicDigits(selectedIds.length)} طلب؟ ستعود للظهور في لوحات تحكم الفنيين.`
        }
        confirmLabel={bulkAction === "delete" ? "حذف المحدد" : bulkAction === "hide" ? "إخفاء المحدد" : "إظهار المحدد"}
        danger={bulkAction === "delete"}
        busy={busyKey === `bulk-${bulkAction}-leads`}
      />

      <ConfirmDialog
        open={confirmExpired}
        onClose={() => setConfirmExpired(false)}
        onConfirm={() => void handleDeleteExpired()}
        title="حذف الطلبات المنتهية"
        message={`هل أنت متأكد من حذف ${toArabicDigits(facets.status.expired)} طلب منتهي نهائياً؟ سيتم إشعار أصحابها. لا يمكن التراجع عن هذا القرار.`}
        confirmLabel="حذف المنتهي"
        danger
        busy={busyKey === "bulk-delete-expired-leads"}
      />

      <LeadDetailsDrawer
        lead={detailsLead}
        open={detailsLead !== null}
        busyKey={busyKey}
        responses={responses}
        responsesLoading={responsesLoading}
        onClose={() => setDetailsLead(null)}
        onHide={setHideTarget}
        onUnhide={(target) => void handleUnhide(target)}
        onDelete={setDeleteTarget}
      />
    </div>
  );
}
