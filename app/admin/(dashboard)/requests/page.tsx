"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  type JoinRequestRow,
} from "@/lib/db/admin";
import {
  filterRequests,
  type RequestStatusFilter,
  type RequestTypeTab,
} from "@/lib/db/admin-selectors";
import { useAdminRequests } from "@/hooks/admin/useAdminRequests";
import { useToast } from "@/hooks/ui/useToast";
import { toArabicDigits } from "@/lib/utils/format";

export default function RequestsPage() {
  const { toast } = useToast();
  const {
    requests,
    loading,
    error,
    busyKey,
    approveRequest,
    rejectRequest,
    deleteRequest,
    refresh,
  } = useAdminRequests();
  const [typeTab, setTypeTab] = useState<RequestTypeTab>("register");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("pending");
  const [approveTarget, setApproveTarget] = useState<JoinRequestRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<JoinRequestRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JoinRequestRow | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<JoinRequestRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const registerCount = requests.filter((item) => item.type === "register").length;
  const reportCount = requests.filter((item) => item.type === "report").length;
  const pendingCount = requests.filter((item) => item.status === "pending").length;

  const filteredRequests = useMemo(
    () => filterRequests(requests, typeTab, statusFilter),
    [requests, typeTab, statusFilter],
  );

  if (loading) return <DashboardLoading />;

  async function handleApprove() {
    if (!approveTarget) return;
    const ok = await approveRequest(approveTarget);
    if (ok) {
      toast("success", "تمت الموافقة ونشر الصنايعي في الدليل");
      setApproveTarget(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    const ok = await rejectRequest(rejectTarget.id);
    if (ok) {
      toast("success", "تم رفض الطلب");
      setRejectTarget(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const ok = await deleteRequest(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف الطلب نهائياً");
      setDeleteTarget(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الطلبات"
        description={`${toArabicDigits(pendingCount)} طلب معلق بانتظار المراجعة.`}
        actions={<RefreshButton onRefresh={() => void refresh()} />}
      />

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <RequestFilters
          typeTab={typeTab}
          statusFilter={statusFilter}
          counts={{ all: requests.length, register: registerCount, report: reportCount }}
          onTypeChange={setTypeTab}
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
