import { AdminSection } from "@/components/admin/AdminSection";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminButton } from "@/components/admin/ui/AdminButton";
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
                <AdminButton
                  type="button"
                  variant="action"
                  disabled={busyKey === `report-review-${report.id}`}
                  onClick={() => onReview(report)}
                >
                  {busyKey === `report-review-${report.id}`
                    ? "جاري..."
                    : "تمت المراجعة"}
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="outlineDanger"
                  disabled={busyKey === `report-dismiss-${report.id}`}
                  onClick={() => onDismiss(report.id)}
                >
                  {busyKey === `report-dismiss-${report.id}` ? "جاري..." : "إغلاق"}
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}