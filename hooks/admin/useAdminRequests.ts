"use client";

import { useEffect, useMemo, useState } from "react";
import {
  approveJoinRequest,
  deleteJoinRequest,
  fetchRequests,
  rejectJoinRequest,
  type JoinRequestRow,
} from "@/lib/db/admin";
import {
  filterRequests,
  type RequestStatusFilter,
} from "@/lib/db/admin-selectors";
import { useToast } from "@/hooks/ui/useToast";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export function useAdminRequests(initialRequests?: JoinRequestRow[]) {
  const { toast } = useToast();
  const { data, loading, error: loadError, refresh } = useAdminQuery(
    fetchRequests,
    initialRequests,
  );
  const { busyKey, error: actionError, run } = useAdminAction();
  const error = loadError || actionError;

  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("pending");
  const [approveTarget, setApproveTarget] = useState<JoinRequestRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<JoinRequestRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JoinRequestRow | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<JoinRequestRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const rawRequests = data ?? [];
  const pendingCount = rawRequests.filter((item) => item.status === "pending").length;
  const rejectedCount = rawRequests.filter((item) => item.status === "rejected").length;

  const filteredRequests = useMemo(
    () => filterRequests(rawRequests, statusFilter),
    [rawRequests, statusFilter],
  );

  const approveRequest = (request: JoinRequestRow) =>
    run(`approve-${request.id}`, () => approveJoinRequest(request), refresh);

  const rejectRequest = (requestId: string) =>
    run(`reject-${requestId}`, () => rejectJoinRequest(requestId), refresh);

  const deleteRequest = (requestId: string) =>
    run(
      `delete-request-${requestId}`,
      () => deleteJoinRequest(requestId),
      refresh,
    );

  const handleApprove = async () => {
    if (!approveTarget) return;
    const ok = await approveRequest(approveTarget);
    if (ok) {
      toast("success", "تمت الموافقة ونشر الصنايعي في الدليل");
      setApproveTarget(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const ok = await rejectRequest(rejectTarget.id);
    if (ok) {
      toast("success", "تم رفض الطلب");
      setRejectTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteRequest(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف الطلب نهائياً");
      setDeleteTarget(null);
    }
  };

  return {
    requests: rawRequests,
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
    error,
    busyKey,
    approveRequest,
    rejectRequest,
    deleteRequest,
    refresh,
  };
}
