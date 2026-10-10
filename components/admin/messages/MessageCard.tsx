import { StatusBadge } from "@/components/admin/StatusBadge";
import { RecordCard } from "@/components/admin/ui/RecordCard";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { IconEye, IconEyeOff, IconTrash, IconUser } from "@/components/shared/icons";
import type { ContactMessageRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast } from "@/lib/utils/time";

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
      onOpen={() => onDetails(message)}
      badge={
        <StatusBadge variant={message.is_read ? "active" : "inactive"}>
          {message.is_read ? "مقروءة" : "غير مقروءة"}
        </StatusBadge>
      }
      title={
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <IconUser className="h-3.5 w-3.5" />
          </span>
          <span className="truncate">{message.name}</span>
        </span>
      }
      meta={
        <span
          title={toArabicDigits(message.created_at.slice(0, 10))}
          className="text-xs text-muted sm:text-sm"
        >
          {formatRelativePast(message.created_at)}
        </span>
      }
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
            aria-label={
              message.is_read
                ? `تحديد رسالة ${message.name} كغير مقروءة`
                : `تحديد رسالة ${message.name} كمقروءة`
            }
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
            aria-label={`حذف رسالة ${message.name}`}
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