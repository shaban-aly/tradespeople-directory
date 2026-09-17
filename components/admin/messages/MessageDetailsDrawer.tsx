import { Drawer } from "@/components/admin/Drawer";
import { DetailField } from "@/components/admin/ui/DetailField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
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
          <DetailField label="الحالة">
            {message.is_read ? "مقروءة" : "غير مقروءة"}
          </DetailField>
          <DetailField label="الاسم">{message.name}</DetailField>
          <DetailField label="رقم الهاتف" dir="ltr" className="text-right">
            {message.phone}
          </DetailField>
          <DetailField label="التاريخ">
            {toArabicDigits(message.created_at)}
          </DetailField>
          <div className="rounded-xl bg-background p-4">
            <p className="mb-2 font-bold text-foreground">الرسالة:</p>
            <p className="whitespace-pre-wrap text-foreground">
              {message.message}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
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
              variant="outlineDanger"
              disabled={busyKey === `delete-message-${message.id}`}
              onClick={() => onDelete(message)}
            >
              حذف الرسالة
            </AdminButton>
          </div>
        </div>
      )}
    </Drawer>
  );
}