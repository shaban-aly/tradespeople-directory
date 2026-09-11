import { AdminSection } from "@/components/admin/AdminSection";
import { EmptyState } from "@/components/admin/EmptyState";
import { IconAlert } from "@/components/shared/icons";
import type { ReportRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function PendingReportsList({
  reports,
  busyKey,
  onReview,
  onDismiss,
  action,
}: {
  reports: ReportRow[];
  busyKey: string;
  onReview: (report: ReportRow) => void;
  onDismiss: (reportId: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <AdminSection
      title="البلاغات المعلّقة"
      description="بانتظار مراجعتك"
      icon={<IconAlert className="h-6 w-6" />}
      action={action}
    >
      {reports.length === 0 ? (
        <EmptyState title="لا توجد بلاغات معلّقة" />
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 sm:p-4"
            >
              <div className="grid min-w-0 gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-sm font-bold text-danger">
                    بلاغ
                  </span>
                  <span className="text-sm text-muted">
                    {toArabicDigits(report.created_at.slice(0, 10))}
                  </span>
                </div>
                <p className="truncate text-base font-bold text-foreground">
                  {report.craftsman_name}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busyKey === `report-review-${report.id}`}
                  onClick={() => onReview(report)}
                  className="min-h-12 rounded-xl bg-action px-4 text-base font-bold text-on-action disabled:opacity-50"
                >
                  {busyKey === `report-review-${report.id}`
                    ? "جاري..."
                    : "تمت المراجعة"}
                </button>
                <button
                  type="button"
                  disabled={busyKey === `report-dismiss-${report.id}`}
                  onClick={() => onDismiss(report.id)}
                  className="min-h-12 rounded-xl border border-danger/40 px-4 text-base font-bold text-danger disabled:opacity-50"
                >
                  {busyKey === `report-dismiss-${report.id}` ? "جاري..." : "إغلاق"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}