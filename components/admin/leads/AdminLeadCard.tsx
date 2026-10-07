import { StatusBadge } from "@/components/admin/StatusBadge";
import { RecordCard } from "@/components/admin/ui/RecordCard";
import { DetailField, DetailFieldList } from "@/components/admin/ui/DetailField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { CopyPhoneButton } from "@/components/admin/ui/CopyPhoneButton";
import { Badge } from "@/components/shared/ui/Badge";
import { LeadImageGallery } from "@/components/leads/LeadImageGallery";
import { RelativeTime } from "@/components/leads/RelativeTime";
import {
  IconEye,
  IconEyeOff,
  IconTrash,
} from "@/components/shared/icons";
import type { AdminLeadRow } from "@/lib/db/admin";
import { leadStatusInfo } from "./leadStatus";
import { toArabicDigits } from "@/lib/utils/format";

type Props = {
  lead: AdminLeadRow;
  busyKey: string | null;
  selected: boolean;
  onToggleSelect: (lead: AdminLeadRow) => void;
  onHide: (lead: AdminLeadRow) => void;
  onUnhide: (lead: AdminLeadRow) => void;
  onDelete: (lead: AdminLeadRow) => void;
  onDetails: (lead: AdminLeadRow) => void;
};

export function AdminLeadCard({
  lead,
  busyKey,
  selected,
  onToggleSelect,
  onHide,
  onUnhide,
  onDelete,
  onDetails,
}: Props) {
  const isBusy =
    busyKey === `delete-lead-${lead.id}` ||
    busyKey === `hide-lead-${lead.id}` ||
    busyKey === `unhide-lead-${lead.id}`;
  const statusInfo = leadStatusInfo(lead.status);

  return (
    <div
      className={`transition-opacity ${isBusy ? "pointer-events-none opacity-50" : ""} ${lead.hidden ? "opacity-70 grayscale-[30%]" : ""} ${selected ? "ring-2 ring-accent" : ""} rounded-xl`}
    >
      <RecordCard
        onOpen={() => onDetails(lead)}
        badge={
          <div className="flex gap-2">
            <label className="flex cursor-pointer items-center" onClick={(event) => event.stopPropagation()}>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(lead)}
                aria-label="تحديد الطلب للإجراء الجماعي"
                className="h-5 w-5 cursor-pointer rounded border-border-strong accent-accent"
              />
            </label>
            <StatusBadge variant={statusInfo.variant}>{statusInfo.label}</StatusBadge>
            {lead.hidden && <StatusBadge variant="rejected">مخفي</StatusBadge>}
            <Badge variant="accent" size="sm">
              {lead.responseCount > 0
                ? `ردود (${toArabicDigits(lead.responseCount)})`
                : "بلا ردود"}
            </Badge>
          </div>
        }
        title={lead.category?.name || "تخصص غير معروف"}
        meta={
          <RelativeTime
            value={lead.created_at}
            mode="past"
            initial={toArabicDigits(lead.created_at.slice(0, 10))}
          />
        }
        body={
          <DetailFieldList className="sm:grid-cols-2">
            <DetailField label="المنطقة">{lead.area?.name}</DetailField>
            <DetailField label="هاتف العميل" dir="ltr" className="text-right">
              <span className="inline-flex items-center gap-1">
                {lead.customer_phone}
                <CopyPhoneButton phone={lead.customer_phone} label="نسخ رقم العميل" />
              </span>
            </DetailField>
            <div className="col-span-full mt-2 break-words rounded-lg bg-accent/5 p-3 text-sm leading-relaxed text-foreground/80">
              <span className="font-bold text-foreground">الوصف: </span>
              {lead.description || "-"}
            </div>
            {lead.image_urls.length > 0 && (
              <div className="col-span-full">
                <LeadImageGallery images={lead.image_urls} alt="صور مشكلة الطلب" />
              </div>
            )}
          </DetailFieldList>
        }
        actions={
          <>
            <AdminButton type="button" variant="outline" onClick={() => onDetails(lead)}>
              التفاصيل
            </AdminButton>
            {lead.hidden ? (
              <AdminButton
                type="button"
                variant="outline"
                className="text-emerald-600 hover:text-emerald-700"
                disabled={isBusy}
                onClick={() => onUnhide(lead)}
              >
                <IconEye className="h-5 w-5 ml-1" />
                إظهار
              </AdminButton>
            ) : (
              <AdminButton
                type="button"
                variant="outline"
                className="text-amber-600 hover:text-amber-700"
                disabled={isBusy}
                onClick={() => onHide(lead)}
              >
                <IconEyeOff className="h-5 w-5 ml-1" />
                إخفاء
              </AdminButton>
            )}
            <AdminButton
              type="button"
              variant="dangerHover"
              size="icon"
              aria-label="حذف الطلب"
              disabled={isBusy}
              onClick={() => onDelete(lead)}
            >
              <IconTrash className="h-5 w-5" />
            </AdminButton>
          </>
        }
      />
    </div>
  );
}
