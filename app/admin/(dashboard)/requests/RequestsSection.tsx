"use client";

import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { ApproveRequestModal } from "@/components/admin/requests/ApproveRequestModal";
import { RequestCard } from "@/components/admin/requests/RequestCard";
import { RequestDetailsDrawer } from "@/components/admin/requests/RequestDetailsDrawer";
import { RequestFilters } from "@/components/admin/requests/RequestFilters";
import { IconInbox } from "@/components/shared/icons";
import { type JoinRequestRow } from "@/lib/db/admin";
import { useAdminRequests } from "@/hooks/admin/useAdminRequests";
import { toArabicDigits } from "@/lib/utils/format";

export function RequestsSection({
  initialRequests,
}: {
  initialRequests: JoinRequestRow[];
}) {
  const {
    requests,
    filteredRequests,
    pendingCount,
    rejectedCount,
    statusFilter,
    setStatusFilter,
    approveTarget,
    setApproveTarget,
    rejectTarget,
    setRejectTarget,
    deleteTarget,
    setDeleteTarget,
    detailsTarget,
    setDetailsTarget,
    handleApprove,
    handleReject,
    handleDelete,
    loading,
    busyKey,
    refresh,
  } = useAdminRequests(initialRequests);

  if (loading) return <DashboardLoading />;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الطلبات"
        description={
          pendingCount === 0
            ? "لا توجد طلبات معلقة بانتظار المراجعة."
            : `${toArabicDigits(pendingCount)} طلب معلق بانتظار المراجعة.`
        }
        actions={<RefreshButton onRefresh={() => void refresh()} />}
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <RequestFilters
          statusFilter={statusFilter}
          counts={{
            all: requests.length,
            pending: pendingCount,
            rejected: rejectedCount,
          }}
          onStatusChange={setStatusFilter}
        />

        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={<IconInbox className="h-8 w-8" />}
            title="لا توجد طلبات بهذا الفلتر"
            description="جرّب تغيير الفلتر أو راجع لاحقاً."
          />
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                busyKey={busyKey}
                onApprove={setApproveTarget}
                onReject={setRejectTarget}
                onDelete={setDeleteTarget}
                onDetails={setDetailsTarget}
              />
            ))}
          </div>
        )}
      </section>

      <ApproveRequestModal
        request={approveTarget}
        open={approveTarget !== null}
        busy={busyKey === `approve-${approveTarget?.id}`}
        onConfirm={() => void handleApprove()}
        onClose={() => setApproveTarget(null)}
      />

      <ConfirmDialog
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => void handleReject()}
        title="رفض الطلب"
        message="هل أنت متأكد من رفض هذا الطلب؟ لا يمكن التراجع عن هذا القرار."
        confirmLabel="رفض الطلب"
        danger
        busy={busyKey === `reject-${rejectTarget?.id}`}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="حذف الطلب"
        message="هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا القرار."
        confirmLabel="حذف الطلب"
        danger
        busy={busyKey === `delete-request-${deleteTarget?.id}`}
      />

      <RequestDetailsDrawer
        request={detailsTarget}
        open={detailsTarget !== null}
        onClose={() => setDetailsTarget(null)}
      />
    </div>
  );
}