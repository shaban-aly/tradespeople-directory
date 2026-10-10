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
  IconMapPin,
  IconPhone,
  IconTrash,
  IconWhatsApp,
} from "@/components/shared/icons";
import type { AdminLeadRow } from "@/lib/db/admin";
import { leadStatusInfo } from "./leadStatus";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast, telHref } from "@/lib/utils/time";
import { whatsappHref } from "@/lib/utils/url";

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
      className={`transition-opacity ${isBusy ? "pointer-events-none opacity-50" : ""} ${lead.hidden ? "opacity-75 grayscale-[25%]" : ""} ${selected ? "ring-2 ring-accent" : ""} rounded-xl`}
    >
      <RecordCard
        onOpen={() => onDetails(lead)}
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <label
              className="flex cursor-pointer items-center"
              onClick={(event) => event.stopPropagation()}
            >
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
            <Badge variant={lead.responseCount > 0 ? "accent" : "neutral"} size="sm">
              {lead.responseCount > 0
                ? `${toArabicDigits(lead.responseCount)}/٣ ردود`
                : "بلا ردود"}
            </Badge>
          </div>
        }
        title={
          <span className="font-heading text-base sm:text-lg font-bold text-foreground">
            {lead.category?.name || "تخصص غير معروف"}
          </span>
        }
        meta={
          <RelativeTime
            value={lead.created_at}
            mode="past"
            initial={formatRelativePast(lead.created_at)}
          />
        }
        body={
          <DetailFieldList className="sm:grid-cols-2">
            <DetailField label="المنطقة">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <IconMapPin className="h-4 w-4 text-accent" />
                {lead.area?.name || "السويس"}
              </span>
            </DetailField>

            <DetailField label="هاتف العميل" dir="ltr" className="text-right">
              <div
                className="inline-flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <a
                  href={telHref(lead.customer_phone)}
                  className="font-mono text-sm font-bold text-foreground hover:text-accent hover:underline"
                  dir="ltr"
                >
                  {lead.customer_phone}
                </a>
                <CopyPhoneButton phone={lead.customer_phone} label="نسخ رقم العميل" />
                <a
                  href={whatsappHref(
                    lead.customer_phone,
                    `السلام عليكم بخصوص طلبك على دليل الصنايعية: ${lead.description?.slice(0, 100) || ""}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-action/15 text-action hover:bg-action/25 transition-colors"
                  aria-label="مراسلة العميل عبر واتساب"
                  title="مراسلة عبر واتساب"
                >
                  <IconWhatsApp className="h-4 w-4" />
                </a>
              </div>
            </DetailField>

            <div className="col-span-full mt-1.5 break-words rounded-xl border border-border/60 bg-accent/5 p-3.5 text-sm leading-relaxed text-foreground/90">
              <span className="font-bold text-foreground">تفاصيل المشكلة: </span>
              {lead.description || "-"}
            </div>

            {lead.image_urls.length > 0 && (
              <div className="col-span-full pt-1" onClick={(e) => e.stopPropagation()}>
                <LeadImageGallery images={lead.image_urls} alt="صور مشكلة الطلب" />
              </div>
            )}
          </DetailFieldList>
        }
        actions={
          <>
            <AdminButton type="button" variant="outline" onClick={() => onDetails(lead)}>
              عرض التفاصيل الكاملة
            </AdminButton>
            {lead.hidden ? (
              <AdminButton
                type="button"
                variant="outlineAction"
                disabled={isBusy}
                onClick={() => onUnhide(lead)}
              >
                <IconEye className="h-5 w-5 me-1" />
                إظهار
              </AdminButton>
            ) : (
              <AdminButton
                type="button"
                variant="outlineWarning"
                disabled={isBusy}
                onClick={() => onHide(lead)}
              >
                <IconEyeOff className="h-5 w-5 me-1" />
                إخفاء
              </AdminButton>
            )}
            <AdminButton
              type="button"
              variant="dangerHover"
              size="icon"
              aria-label={`حذف طلب ${lead.category?.name || "العميل"}`}
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
