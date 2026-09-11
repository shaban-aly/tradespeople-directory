import { StatusBadge } from "@/components/admin/StatusBadge";
import { IconTrash } from "@/components/shared/icons";
import type { ReportRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function ReportCard({
  report,
  busyKey,
  onReview,
  onDismiss,
  onDelete,
  onDetails,
}: {
  report: ReportRow;
  busyKey: string;
  onReview: (report: ReportRow) => void;
  onDismiss: (report: ReportRow) => void;
  onDelete: (report: ReportRow) => void;
  onDetails: (report: ReportRow) => void;
}) {
  const statusVariant =
    report.status === "pending"
      ? ("pending" as const)
      : report.status === "reviewed"
        ? ("reviewed" as const)
        : ("dismissed" as const);

  return (
    <article className="grid gap-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant={statusVariant}>
            {report.status === "pending"
              ? "معلق"
              : report.status === "reviewed"
                ? "تمت المراجعة"
                : "مغلق"}
          </StatusBadge>
          <span className="text-base font-bold text-foreground">بلاغ</span>
        </div>
        <span className="text-base text-muted">
          {toArabicDigits(report.created_at.slice(0, 10))}
        </span>
      </div>

      <div className="grid gap-2 text-base text-muted sm:grid-cols-2">
        <p>
          <span className="font-bold text-foreground">الصنايعي: </span>
          {report.craftsman_name}
        </p>
        {report.phone && (
          <p dir="ltr" className="text-right">
            <span className="font-bold text-foreground">رقم المبلّغ: </span>
            {report.phone}
          </p>
        )}
        <p className="sm:col-span-2">
          <span className="font-bold text-foreground">المشكلة: </span>
          <span className="line-clamp-2">{report.message}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onDetails(report)}
          className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground"
        >
          التفاصيل
        </button>
        {report.status === "pending" && (
          <>
            <button
              type="button"
              disabled={busyKey === `report-review-${report.id}`}
              onClick={() => onReview(report)}
              className="min-h-12 rounded-xl bg-action px-4 text-base font-bold text-on-action disabled:opacity-50"
            >
              {busyKey === `report-review-${report.id}` ? "جاري..." : "تمت المراجعة"}
            </button>
            <button
              type="button"
              disabled={busyKey === `report-dismiss-${report.id}`}
              onClick={() => onDismiss(report)}
              className="min-h-12 rounded-xl border border-danger/40 px-4 text-base font-bold text-danger disabled:opacity-50"
            >
              {busyKey === `report-dismiss-${report.id}` ? "جاري..." : "إغلاق"}
            </button>
          </>
        )}
        <button
          type="button"
          aria-label="حذف البلاغ"
          disabled={busyKey === `report-delete-${report.id}`}
          onClick={() => onDelete(report)}
          className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
        >
          <IconTrash className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}