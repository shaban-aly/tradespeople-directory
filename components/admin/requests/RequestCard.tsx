import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RecordCard } from "@/components/admin/ui/RecordCard";
import { DetailField, DetailFieldList } from "@/components/admin/ui/DetailField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconTrash, IconUsers } from "@/components/shared/icons";
import type { JoinRequestRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast } from "@/lib/utils/time";
import { IMAGE_ASPECT, withImageAspect } from "@/lib/utils/image-transform";

export function RequestCard({
  request,
  busyKey,
  onApprove,
  onReject,
  onDelete,
  onDetails,
}: {
  request: JoinRequestRow;
  busyKey: string;
  onApprove: (request: JoinRequestRow) => void;
  onReject: (request: JoinRequestRow) => void;
  onDelete: (request: JoinRequestRow) => void;
  onDetails: (request: JoinRequestRow) => void;
}) {
  const statusVariant =
    request.status === "pending"
      ? ("pending" as const)
      : request.status === "approved"
        ? ("approved" as const)
        : ("rejected" as const);

  const statusLabel =
    request.status === "pending"
      ? "معلق"
      : request.status === "approved"
        ? "مقبول"
        : "مرفوض";

  return (
    <RecordCard
      onOpen={() => onDetails(request)}
      badge={<StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>}
      title={
        <span className="flex items-center gap-2">
          {request.image_url ? (
            <span className="relative inline-block h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-border">
              <Image
                src={withImageAspect(request.image_url, IMAGE_ASPECT.SQUARE)}
                alt={request.name ?? "صورة الصنايعي"}
                fill
                sizes="32px"
                className="object-cover"
              />
            </span>
          ) : (
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <IconUsers className="h-4 w-4" />
            </span>
          )}
          <span className="truncate">{request.name || "طلب بلا اسم"}</span>
        </span>
      }
      meta={
        <span
          title={toArabicDigits(request.created_at.slice(0, 10))}
          className="text-xs text-muted sm:text-sm"
        >
          {formatRelativePast(request.created_at)}
        </span>
      }
      body={
        <DetailFieldList className="sm:grid-cols-2">
          <DetailField label="التخصص">{request.category?.name ?? "—"}</DetailField>
          <DetailField label="المنطقة">{request.area?.name ?? "—"}</DetailField>
          <DetailField label="الهاتف" dir="ltr" className="text-right">
            {request.phone ?? "—"}
          </DetailField>
          {request.whatsapp ? (
            <DetailField label="الواتساب" dir="ltr" className="text-right">
              {request.whatsapp}
            </DetailField>
          ) : request.description ? (
            <DetailField label="الوصف" className="line-clamp-1">
              {request.description}
            </DetailField>
          ) : null}
        </DetailFieldList>
      }
      actions={
        <>
          <AdminButton type="button" variant="outline" onClick={() => onDetails(request)}>
            التفاصيل
          </AdminButton>
          {request.status === "pending" && (
            <>
              <AdminButton
                type="button"
                variant="action"
                disabled={busyKey === `approve-${request.id}`}
                onClick={() => onApprove(request)}
              >
                موافقة
              </AdminButton>
              <AdminButton
                type="button"
                variant="outlineDanger"
                disabled={busyKey === `reject-${request.id}`}
                onClick={() => onReject(request)}
              >
                رفض
              </AdminButton>
            </>
          )}
          <AdminButton
            type="button"
            variant="dangerHover"
            size="icon"
            aria-label={`حذف طلب ${request.name ?? "الصنايعي"}`}
            disabled={busyKey === `delete-request-${request.id}`}
            onClick={() => onDelete(request)}
          >
            <IconTrash className="h-5 w-5" />
          </AdminButton>
        </>
      }
    />
  );
}