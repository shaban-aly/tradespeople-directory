import { StatusBadge } from "@/components/admin/StatusBadge";
import { IconEye, IconEyeOff, IconTrash } from "@/components/shared/icons";
import type { ContactMessageRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function MessageCard({
  message,
  busyKey,
  onToggleRead,
  onDelete,
  onDetails,
}: {
  message: ContactMessageRow;
  busyKey: string;
  onToggleRead: (message: ContactMessageRow) => void;
  onDelete: (message: ContactMessageRow) => void;
  onDetails: (message: ContactMessageRow) => void;
}) {
  return (
    <article className="grid gap-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant={message.is_read ? "active" : "inactive"}>
            {message.is_read ? "مقروءة" : "غير مقروءة"}
          </StatusBadge>
          <span className="text-base font-bold text-foreground">
            {message.name}
          </span>
        </div>
        <span className="text-base text-muted">
          {toArabicDigits(message.created_at.slice(0, 10))}
        </span>
      </div>

      <p
        className={`line-clamp-2 text-base ${
          message.is_read ? "text-muted" : "font-bold text-foreground"
        }`}
      >
        {message.message}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onDetails(message)}
          className="min-h-12 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground"
        >
          التفاصيل
        </button>
        <button
          type="button"
          disabled={busyKey === `message-${message.id}`}
          onClick={() => onToggleRead(message)}
          className="flex min-h-12 items-center gap-2 rounded-xl border border-border px-4 text-base font-bold text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          {message.is_read ? (
            <IconEyeOff className="h-5 w-5" />
          ) : (
            <IconEye className="h-5 w-5" />
          )}
          {message.is_read ? "تحديد كغير مقروءة" : "تحديد كمقروءة"}
        </button>
        <button
          type="button"
          aria-label="حذف الرسالة"
          disabled={busyKey === `delete-message-${message.id}`}
          onClick={() => onDelete(message)}
          className="rounded-xl border border-border p-3 text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
        >
          <IconTrash className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}
