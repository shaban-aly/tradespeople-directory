"use client";

import {
  deleteReport,
  fetchReports,
  updateReportStatus,
  type ReportRow,
} from "@/lib/db/admin";
import { useAdminAction } from "./useAdminAction";
import { useAdminQuery } from "./useAdminQuery";

export function useAdminReports(initialReports?: ReportRow[]) {
  const { data, loading, error: loadError, refresh } = useAdminQuery(
    fetchReports,
    initialReports,
  );
  const { busyKey, error: actionError, run } = useAdminAction();

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

  return {
    reports: data ?? [],
    loading,
    error: loadError || actionError,
    busyKey,
    reviewReport,
    dismissReport,
    removeReport,
    refresh,
  };
}