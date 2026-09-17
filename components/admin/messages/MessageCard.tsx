import { StatusBadge } from "@/components/admin/StatusBadge";
import { RecordCard } from "@/components/admin/ui/RecordCard";
import { AdminButton } from "@/components/admin/ui/AdminButton";
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
    <RecordCard
      badge={
        <StatusBadge variant={message.is_read ? "active" : "inactive"}>
          {message.is_read ? "مقروءة" : "غير مقروءة"}
        </StatusBadge>
      }
      title={message.name}
      meta={toArabicDigits(message.created_at.slice(0, 10))}
      body={
        <p
          className={`line-clamp-2 text-base ${
            message.is_read ? "text-muted" : "font-bold text-foreground"
          }`}
        >
          {message.message}
        </p>
      }
      actions={
        <>
          <AdminButton type="button" variant="outline" onClick={() => onDetails(message)}>
            التفاصيل
          </AdminButton>
          <AdminButton
            type="button"
            variant="outline"
            disabled={busyKey === `message-${message.id}`}
            onClick={() => onToggleRead(message)}
          >
            {message.is_read ? (
              <IconEyeOff className="h-5 w-5" />
            ) : (
              <IconEye className="h-5 w-5" />
            )}
            {message.is_read ? "تحديد كغير مقروءة" : "تحديد كمقروءة"}
          </AdminButton>
          <AdminButton
            type="button"
            variant="dangerHover"
            size="icon"
            aria-label="حذف الرسالة"
            disabled={busyKey === `delete-message-${message.id}`}
            onClick={() => onDelete(message)}
          >
            <IconTrash className="h-5 w-5" />
          </AdminButton>
        </>
      }
    />
  );
}