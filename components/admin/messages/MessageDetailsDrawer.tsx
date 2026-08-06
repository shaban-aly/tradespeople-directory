import { Drawer } from "@/components/admin/Drawer";
import { IconEye, IconEyeOff } from "@/components/shared/icons";
import type { ContactMessageRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";

export function MessageDetailsDrawer({
  message,
  open,
  busyKey,
  onClose,
  onToggleRead,
  onDelete,
}: {
  message: ContactMessageRow | null;
  open: boolean;
  busyKey: string;
  onClose: () => void;
  onToggleRead: (message: ContactMessageRow) => void;
  onDelete: (message: ContactMessageRow) => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} title="تفاصيل الرسالة">
      {message && (
        <div className="grid gap-3 text-base text-muted">
          <p>
            <span className="font-bold text-foreground">الحالة: </span>
            {message.is_read ? "مقروءة" : "غير مقروءة"}
          </p>
          <p>
            <span className="font-bold text-foreground">الاسم: </span>
            {message.name}
          </p>
          <p dir="ltr" className="text-right">
            <span className="font-bold text-foreground">رقم الهاتف: </span>
            {message.phone}
          </p>
          <p>
            <span className="font-bold text-foreground">التاريخ: </span>
            {toArabicDigits(message.created_at)}
          </p>
          <div className="rounded-xl bg-background p-4">
            <p className="mb-2 font-bold text-foreground">الرسالة:</p>
            <p className="whitespace-pre-wrap text-foreground">
              {message.message}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
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
              disabled={busyKey === `delete-message-${message.id}`}
              onClick={() => onDelete(message)}
              className="min-h-12 rounded-xl border border-danger/40 px-4 text-base font-bold text-danger disabled:opacity-50"
            >
              حذف الرسالة
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
