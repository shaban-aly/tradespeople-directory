"use client";

import {
  approveJoinRequest,
  fetchAdminOverviewMetrics,
  fetchCategories,
  fetchAreas,
  fetchCraftsmen,
  fetchMessages,
  rejectJoinRequest,
  deleteReport,
  updateReportStatus,
  type JoinRequestRow,
  type ReportRow,
} from "@/lib/db/admin";
import { buildOverviewMetrics, type OverviewMetrics } from "@/lib/db/admin-selectors";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export interface AdminOverviewData {
  requests: JoinRequestRow[];
  reports: ReportRow[];
  categories: Awaited<ReturnType<typeof fetchCategories>>;
  areas: Awaited<ReturnType<typeof fetchAreas>>;
  craftsmen: Awaited<ReturnType<typeof fetchCraftsmen>>;
  messages: Awaited<ReturnType<typeof fetchMessages>>;
}

export function useAdminOverview(initialData?: OverviewMetrics | AdminOverviewData) {
  const initialMetrics =
    initialData && "requests" in initialData
      ? buildOverviewMetrics(initialData)
      : (initialData as OverviewMetrics | undefined);

  const { data: metrics, loading, error: loadError, refresh } = useAdminQuery(
    () => fetchAdminOverviewMetrics(),
    initialMetrics,
  );
  const { busyKey, error: actionError, run } = useAdminAction();

  const approveRequest = (request: JoinRequestRow) =>
    run(`approve-${request.id}`, () => approveJoinRequest(request), refresh);

  const rejectRequest = (requestId: string) =>
    run(`reject-${requestId}`, () => rejectJoinRequest(requestId), refresh);

  const reviewReport = (report: ReportRow) =>
    run(`report-review-${report.id}`, () => updateReportStatus(report.id, "reviewed"), refresh);

  const dismissReport = (reportId: string) =>
    run(`report-dismiss-${reportId}`, () => updateReportStatus(reportId, "dismissed"), refresh);

  const removeReport = (reportId: string) =>
    run(`report-delete-${reportId}`, () => deleteReport(reportId), refresh);

  return {
    metrics,
    loading,
    error: loadError || actionError,
    busyKey,
    approveRequest,
    rejectRequest,
    reviewReport,
    dismissReport,
    removeReport,
    refresh,
  };
}
