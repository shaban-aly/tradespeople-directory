"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { ReportCard } from "@/components/admin/reports/ReportCard";
import { ReportDetailsDrawer } from "@/components/admin/reports/ReportDetailsDrawer";
import { ReportFilters } from "@/components/admin/reports/ReportFilters";
import { IconAlert } from "@/components/shared/icons";
import type { ReportRow } from "@/lib/db/admin";
import { useAdminReports } from "@/hooks/admin/useAdminReports";
import { toArabicDigits } from "@/lib/utils/format";

export function ReportsSection({
  initialReports,
}: {
  initialReports: ReportRow[];
}) {
  const {
    reports,
    filteredReports,
    pendingCount,
    reviewedCount,
    dismissedCount,
    statusFilter,
    setStatusFilter,
    deleteTarget,
    setDeleteTarget,
    detailsTarget,
    setDetailsTarget,
    handleReview,
    handleDismiss,
    handleDelete,
    loading,
    busyKey,
    refresh,
  } = useAdminReports(initialReports);

  if (loading) return <DashboardLoading />;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="البلاغات"
        description={
          pendingCount === 0
            ? "لا توجد بلاغات معلّقة بانتظار المراجعة."
            : `${toArabicDigits(pendingCount)} بلاغ معلّق بانتظار المراجعة.`
        }
        actions={<RefreshButton onRefresh={() => void refresh()} />}
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <ReportFilters
          statusFilter={statusFilter}
          counts={{
            all: reports.length,
            pending: pendingCount,
            reviewed: reviewedCount,
            dismissed: dismissedCount,
          }}
          onStatusChange={setStatusFilter}
        />

        {filteredReports.length === 0 ? (
          <EmptyState
            icon={<IconAlert className="h-8 w-8" />}
            title="لا توجد بلاغات بهذا الفلتر"
            description="جرّب تغيير الفلتر أو راجع لاحقاً."
          />
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                busyKey={busyKey}
                onReview={handleReview}
                onDismiss={handleDismiss}
                onDelete={setDeleteTarget}
                onDetails={setDetailsTarget}
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف البلاغ"
        message="هل أنت متأكد من حذف هذا البلاغ نهائياً؟ لا يمكن التراجع عن هذا القرار."
        confirmLabel="حذف البلاغ"
        danger
        busy={busyKey === `report-delete-${deleteTarget?.id}`}
      />

      <ReportDetailsDrawer
        report={detailsTarget}
        open={detailsTarget !== null}
        onClose={() => setDetailsTarget(null)}
      />
    </div>
  );
}