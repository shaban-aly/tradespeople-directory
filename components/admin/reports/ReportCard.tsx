import { StatusBadge } from "@/components/admin/StatusBadge";
import { RecordCard } from "@/components/admin/ui/RecordCard";
import { DetailField, DetailFieldList } from "@/components/admin/ui/DetailField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
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

  const statusLabel =
    report.status === "pending"
      ? "معلق"
      : report.status === "reviewed"
        ? "تمت المراجعة"
        : "مغلق";

  return (
    <RecordCard
      badge={<StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>}
      title="بلاغ"
      meta={toArabicDigits(report.created_at.slice(0, 10))}
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
            aria-label="حذف البلاغ"
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