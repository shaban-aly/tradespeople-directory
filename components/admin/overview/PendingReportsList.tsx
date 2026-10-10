import { AdminSection } from "@/components/admin/AdminSection";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconAlert, IconCheck } from "@/components/shared/icons";
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
  onDismiss: (report: ReportRow) => void;
  action?: React.ReactNode;
}) {
  return (
    <AdminSection
      title="البلاغات المعلّقة"
      description="شكاوى وتقارير المستخدمين بانتظار المراجعة"
      icon={<IconAlert className="h-5 w-5" />}
      action={action}
    >
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-dashed border-border/80 bg-background/40 py-4 px-3 sm:py-8 sm:px-4 text-center">
          <div className="flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-action/10 text-action">
            <IconCheck className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <h3 className="mt-2 text-xs sm:text-sm font-bold text-foreground">
            لا توجد بلاغات معلقة حالياً
          </h3>
          <p className="mt-0.5 max-w-sm text-xs text-muted">
            سجل البلاغات نظيف بالكامل؛ أي شكوى جديدة ستظهر هنا فور إرسالها.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:gap-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="group flex flex-col gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-border bg-card p-2.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-warning/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="grid min-w-0 gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-0.5 text-xs font-bold text-danger">
                    <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                    بلاغ مستعجل
                  </span>
                  <span className="text-xs text-muted">
                    {toArabicDigits(report.created_at.slice(0, 10))}
                  </span>
                </div>
                <p className="truncate font-heading text-base font-bold text-foreground">
                  المشكو في حقه: {report.craftsman_name}
                </p>
                {report.message && (
                  <p className="line-clamp-2 text-xs text-muted leading-relaxed">
                    نص البلاغ: {report.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t border-border/40 pt-2 sm:border-0 sm:pt-0">
                <AdminButton
                  type="button"
                  variant="action"
                  size="sm"
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
                  size="sm"
                  disabled={busyKey === `report-dismiss-${report.id}`}
                  onClick={() => onDismiss(report)}
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