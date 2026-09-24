"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteReport,
  fetchReports,
  updateReportStatus,
  type ReportRow,
} from "@/lib/db/admin";
import {
  filterReports,
  type ReportStatusFilter,
} from "@/lib/db/admin-selectors";
import { useToast } from "@/hooks/ui/useToast";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export function useAdminReports(initialReports?: ReportRow[]) {
  const { toast } = useToast();
  const { data, loading, error: loadError, refresh } = useAdminQuery(
    fetchReports,
    initialReports,
  );
  const { busyKey, error: actionError, run } = useAdminAction();
  const error = loadError || actionError;

  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>("pending");
  const [deleteTarget, setDeleteTarget] = useState<ReportRow | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<ReportRow | null>(null);

  useEffect(() => {
    if (error) toast("error", error);
  }, [error, toast]);

  const rawReports = data ?? [];
  const pendingCount = rawReports.filter((item) => item.status === "pending").length;
  const reviewedCount = rawReports.filter((item) => item.status === "reviewed").length;
  const dismissedCount = rawReports.filter((item) => item.status === "dismissed").length;

  const filteredReports = useMemo(
    () => filterReports(rawReports, statusFilter),
    [rawReports, statusFilter],
  );

  const reviewReport = (report: ReportRow) =>
    run(
      `report-review-${report.id}`,
      () => updateReportStatus(report.id, "reviewed"),
      refresh,
    );

  const dismissReport = (reportId: string) =>
    run(
      `report-dismiss-${reportId}`,
      () => updateReportStatus(reportId, "dismissed"),
      refresh,
    );

  const removeReport = (reportId: string) =>
    run(`report-delete-${reportId}`, () => deleteReport(reportId), refresh);

  const handleReview = async (report: ReportRow) => {
    const ok = await reviewReport(report);
    if (ok) toast("success", "تم اعتبار البلاغ مُراجَعاً");
  };

  const handleDismiss = async (report: ReportRow) => {
    const ok = await dismissReport(report.id);
    if (ok) toast("success", "تم إغلاق البلاغ");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await removeReport(deleteTarget.id);
    if (ok) {
      toast("success", "تم حذف البلاغ نهائياً");
      setDeleteTarget(null);
    }
  };

  return {
    reports: rawReports,
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
    error,
    busyKey,
    reviewReport,
    dismissReport,
    removeReport,
    refresh,
  };
}