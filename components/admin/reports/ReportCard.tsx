import { StatusBadge } from "@/components/admin/StatusBadge";
import { RecordCard } from "@/components/admin/ui/RecordCard";
import { DetailField, DetailFieldList } from "@/components/admin/ui/DetailField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconAlert, IconTrash } from "@/components/shared/icons";
import type { ReportRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast } from "@/lib/utils/time";

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

  const statusLabel =
    report.status === "pending"
      ? "معلق"
      : report.status === "reviewed"
        ? "تمت المراجعة"
        : "مغلق";

  return (
    <RecordCard
      onOpen={() => onDetails(report)}
      badge={<StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>}
      title={
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
            <IconAlert className="h-3.5 w-3.5" />
          </span>
          <span className="truncate">بلاغ: {report.craftsman_name}</span>
        </span>
      }
      meta={
        <span
          title={toArabicDigits(report.created_at.slice(0, 10))}
          className="text-xs text-muted sm:text-sm"
        >
          {formatRelativePast(report.created_at)}
        </span>
      }
      body={
        <DetailFieldList className="sm:grid-cols-2">
          <DetailField label="الصنايعي">{report.craftsman_name}</DetailField>
          {report.phone && (
            <DetailField label="رقم المبلّغ" dir="ltr" className="text-right">
              {report.phone}
            </DetailField>
          )}
          <DetailField label="المشكلة" className="sm:col-span-2">
            <span className="line-clamp-2">{report.message}</span>
          </DetailField>
        </DetailFieldList>
      }
      actions={
        <>
          <AdminButton type="button" variant="outline" onClick={() => onDetails(report)}>
            التفاصيل
          </AdminButton>
          {report.status === "pending" && (
            <>
              <AdminButton
                type="button"
                variant="action"
                disabled={busyKey === `report-review-${report.id}`}
                aria-label={`اعتماد مراجعة بلاغ ${report.craftsman_name}`}
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
                aria-label={`إغلاق بلاغ ${report.craftsman_name}`}
                onClick={() => onDismiss(report)}
              >
                {busyKey === `report-dismiss-${report.id}` ? "جاري..." : "إغلاق"}
              </AdminButton>
            </>
          )}
          <AdminButton
            type="button"
            variant="dangerHover"
            size="icon"
            aria-label={`حذف بلاغ ${report.craftsman_name}`}
            disabled={busyKey === `report-delete-${report.id}`}
            onClick={() => onDelete(report)}
          >
            <IconTrash className="h-5 w-5" />
          </AdminButton>
        </>
      }
    />
  );
}