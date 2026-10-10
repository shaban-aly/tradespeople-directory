import { Drawer } from "@/components/admin/Drawer";
import { DetailField } from "@/components/admin/ui/DetailField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import {
  IconAlert,
  IconPhone,
  IconTrash,
  IconWhatsApp,
} from "@/components/shared/icons";
import type { ReportRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast } from "@/lib/utils/time";
import { telHref, whatsappHref } from "@/lib/utils/url";

export function ReportDetailsDrawer({
  report,
  open,
  busyKey,
  onClose,
  onReview,
  onDismiss,
  onDelete,
}: {
  report: ReportRow | null;
  open: boolean;
  busyKey?: string;
  onClose: () => void;
  onReview?: (report: ReportRow) => void;
  onDismiss?: (report: ReportRow) => void;
  onDelete?: (report: ReportRow) => void;
}) {
  const statusVariant =
    report?.status === "pending"
      ? ("pending" as const)
      : report?.status === "reviewed"
        ? ("reviewed" as const)
        : ("dismissed" as const);

  const statusLabel =
    report?.status === "pending"
      ? "معلق"
      : report?.status === "reviewed"
        ? "تمت المراجعة"
        : "مغلق";

  return (
    <Drawer open={open} onClose={onClose} title="تفاصيل البلاغ">
      {report && (
        <div className="grid gap-3 text-base text-muted">
          <DetailField label="الحالة">
            <StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>
          </DetailField>
          <DetailField label="التاريخ">
            {toArabicDigits(report.created_at.slice(0, 10))} ({formatRelativePast(report.created_at)})
          </DetailField>
          <DetailField label="الصنايعي">{report.craftsman_name}</DetailField>
          {report.phone && (
            <DetailField label="رقم المبلّغ">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={telHref(report.phone)}
                  className="inline-flex items-center gap-1.5 font-bold text-accent hover:underline"
                  dir="ltr"
                >
                  <IconPhone className="h-4 w-4" />
                  <span>{toArabicDigits(report.phone)}</span>
                </a>
                <a
                  href={whatsappHref(report.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-action/15 px-2.5 py-1 text-xs font-semibold text-action hover:bg-action/25 transition-colors"
                >
                  <IconWhatsApp className="h-3.5 w-3.5" />
                  <span>مراسلة واتساب</span>
                </a>
              </div>
            </DetailField>
          )}
          {report.reporter_user_id && (
            <DetailField label="المبلّغ">
              مستخدم مسجّل (تم التحقق من حسابه)
            </DetailField>
          )}
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <p className="mb-2 font-bold text-foreground">المشكلة المبلغ عنها:</p>
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {report.message}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-danger/10 p-3 text-danger">
            <IconAlert className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              راجع البلاغ وتواصل مع الطرفين قبل اتخاذ قرار الإغلاق.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {report.status === "pending" && onReview && (
              <AdminButton
                type="button"
                variant="action"
                disabled={busyKey === `report-review-${report.id}`}
                aria-label={`اعتماد مراجعة بلاغ ${report.craftsman_name}`}
                onClick={() => onReview(report)}
              >
                {busyKey === `report-review-${report.id}` ? "جاري..." : "تمت المراجعة"}
              </AdminButton>
            )}
            {report.status === "pending" && onDismiss && (
              <AdminButton
                type="button"
                variant="outline"
                disabled={busyKey === `report-dismiss-${report.id}`}
                aria-label={`إغلاق بلاغ ${report.craftsman_name}`}
                onClick={() => onDismiss(report)}
              >
                {busyKey === `report-dismiss-${report.id}` ? "جاري..." : "إغلاق البلاغ"}
              </AdminButton>
            )}
            {onDelete && (
              <AdminButton
                type="button"
                variant="outlineDanger"
                disabled={busyKey === `report-delete-${report.id}`}
                aria-label={`حذف بلاغ ${report.craftsman_name}`}
                onClick={() => onDelete(report)}
              >
                <IconTrash className="h-5 w-5" />
                حذف البلاغ
              </AdminButton>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}