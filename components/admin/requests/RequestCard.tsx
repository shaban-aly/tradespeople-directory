import { StatusBadge } from "@/components/admin/StatusBadge";
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

  return (
    <article className="grid gap-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant={statusVariant}>
            {request.status === "pending"
              ? "معلق"
              : request.status === "approved"
                ? "مقبول"
                : "مرفوض"}
          </StatusBadge>
          <span className="text-base font-bold text-foreground">
            {request.type === "register" ? "طلب تسجيل" : "بلاغ"}
          </span>
        </div>
        <span className="text-base text-muted">
          {toArabicDigits(request.created_at.slice(0, 10))}
        </span>
      </div>

      <div className="grid gap-2 text-base text-muted sm:grid-cols-2">
        {request.type === "register" ? (
          <>
            <p>
              <span className="font-bold text-foreground">الاسم: </span>
              {request.name}
            </p>
            <p>
              <span className="font-bold text-foreground">التخصص: </span>
              {request.category?.name}
            </p>
            <p>
              <span className="font-bold text-foreground">المنطقة: </span>
              {request.area?.name}
            </p>
            <p dir="ltr" className="text-right">
              <span className="font-bold text-foreground">الهاتف: </span>
              {request.phone}
            </p>
          </>
        ) : (
          <>
            <p>
              <span className="font-bold text-foreground">الصنايعي: </span>
              {request.craftsman_name}
            </p>
            <p dir="ltr" className="text-right">
              <span className="font-bold text-foreground">رقم المبلغ: </span>
              {request.phone}
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onDetails(request)}
          className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground"
        >
          التفاصيل
        </button>
        {request.status === "pending" && (
          <>
            <button
              type="button"
              disabled={busyKey === `approve-${request.id}`}
              onClick={() => onApprove(request)}
              className="min-h-12 rounded-xl bg-action px-4 text-base font-bold text-on-action disabled:opacity-50"
            >
              موافقة
            </button>
            <button
              type="button"
              disabled={busyKey === `reject-${request.id}`}
              onClick={() => onReject(request)}
              className="min-h-12 rounded-xl border border-danger/40 px-4 text-base font-bold text-danger disabled:opacity-50"
            >
              رفض
            </button>
          </>
        )}
        <button
          type="button"
          aria-label="حذف الطلب"
          disabled={busyKey === `delete-request-${request.id}`}
          onClick={() => onDelete(request)}
          className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
        >
          <IconTrash className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
