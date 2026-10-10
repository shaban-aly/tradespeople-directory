import { Drawer } from "@/components/admin/Drawer";
import { DetailField } from "@/components/admin/ui/DetailField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import {
  IconEye,
  IconEyeOff,
  IconPhone,
  IconTrash,
  IconWhatsApp,
} from "@/components/shared/icons";
import type { ContactMessageRow } from "@/lib/db/admin";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast } from "@/lib/utils/time";
import { telHref, whatsappHref } from "@/lib/utils/url";

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
            <StatusBadge variant={message.is_read ? "active" : "inactive"}>
              {message.is_read ? "مقروءة" : "غير مقروءة"}
            </StatusBadge>
          </DetailField>
          <DetailField label="الاسم">{message.name}</DetailField>
          <DetailField label="رقم الهاتف">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={telHref(message.phone)}
                className="inline-flex items-center gap-1.5 font-bold text-accent hover:underline"
                dir="ltr"
              >
                <IconPhone className="h-4 w-4" />
                <span>{toArabicDigits(message.phone)}</span>
              </a>
              <a
                href={whatsappHref(message.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-action/15 px-2.5 py-1 text-xs font-semibold text-action hover:bg-action/25"
              >
                <IconWhatsApp className="h-3.5 w-3.5" />
                <span>مراسلة واتساب</span>
              </a>
            </div>
          </DetailField>
          <DetailField label="التاريخ">
            {toArabicDigits(message.created_at.slice(0, 10))} ({formatRelativePast(message.created_at)})
          </DetailField>
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <p className="mb-2 font-bold text-foreground">نص الرسالة:</p>
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {message.message}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
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
              variant="outlineDanger"
              disabled={busyKey === `delete-message-${message.id}`}
              aria-label={`حذف رسالة ${message.name}`}
              onClick={() => onDelete(message)}
            >
              <IconTrash className="h-5 w-5" />
              حذف الرسالة
            </AdminButton>
          </div>
        </div>
      )}
    </Drawer>
  );
}