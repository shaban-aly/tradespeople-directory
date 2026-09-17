import { StatusBadge } from "@/components/admin/StatusBadge";
import { RecordCard } from "@/components/admin/ui/RecordCard";
import { DetailField, DetailFieldList } from "@/components/admin/ui/DetailField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconTrash } from "@/components/shared/icons";
import type { JoinRequestRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

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
      badge={<StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>}
      title="طلب تسجيل"
      meta={toArabicDigits(request.created_at.slice(0, 10))}
      body={
        <DetailFieldList className="sm:grid-cols-2">
          <DetailField label="الاسم">{request.name}</DetailField>
          <DetailField label="التخصص">{request.category?.name}</DetailField>
          <DetailField label="المنطقة">{request.area?.name}</DetailField>
          <DetailField label="الهاتف" dir="ltr" className="text-right">
            {request.phone}
          </DetailField>
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
            aria-label="حذف الطلب"
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