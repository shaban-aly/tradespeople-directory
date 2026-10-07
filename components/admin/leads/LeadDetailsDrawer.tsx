import { Drawer } from "@/components/admin/Drawer";
import { DetailField, DetailFieldList } from "@/components/admin/ui/DetailField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { CopyPhoneButton } from "@/components/admin/ui/CopyPhoneButton";
import { LeadImageGallery } from "@/components/leads/LeadImageGallery";
import { RelativeTime } from "@/components/leads/RelativeTime";
import { craftsmanHref } from "@/lib/utils/url";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import {
  IconEye,
  IconEyeOff,
  IconInbox,
  IconTrash,
  IconWhatsApp,
} from "@/components/shared/icons";
import type { AdminLeadResponseRow, AdminLeadRow } from "@/lib/db/admin";
import { leadStatusInfo } from "./leadStatus";
import { toArabicDigits } from "@/lib/utils/format";
import { whatsappHref } from "@/lib/utils/url";

type Props = {
  lead: AdminLeadRow | null;
  open: boolean;
  busyKey: string | null;
  responses: AdminLeadResponseRow[];
  responsesLoading: boolean;
  onClose: () => void;
  onHide: (lead: AdminLeadRow) => void;
  onUnhide: (lead: AdminLeadRow) => void;
  onDelete: (lead: AdminLeadRow) => void;
};

export function LeadDetailsDrawer({
  lead,
  open,
  busyKey,
  responses,
  responsesLoading,
  onClose,
  onHide,
  onUnhide,
  onDelete,
}: Props) {
  if (!lead) return null;

  const isDeleteBusy = busyKey === `delete-lead-${lead.id}`;
  const isHideBusy =
    busyKey === `hide-lead-${lead.id}` || busyKey === `unhide-lead-${lead.id}`;
  const isBusy = isDeleteBusy || isHideBusy;

  const statusInfo = leadStatusInfo(lead.status);

  return (
    <Drawer open={open} onClose={onClose} title="تفاصيل الطلب">
      <div className={`flex flex-col gap-6 p-4 md:p-6 ${isBusy ? "pointer-events-none opacity-50" : ""}`}>
        <div className="flex gap-2">
          <StatusBadge variant={statusInfo.variant}>{statusInfo.label}</StatusBadge>
          {lead.hidden && <StatusBadge variant="rejected">مخفي</StatusBadge>}
        </div>

        {lead.hidden && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed">
            <p className="font-bold text-foreground">
              مخفي
              {lead.hidden_at && (
                <>
                  {" "}منذ{" "}
                  <RelativeTime
                    value={lead.hidden_at}
                    mode="past"
                    initial={toArabicDigits(lead.hidden_at.slice(0, 10))}
                  />
                </>
              )}
            </p>
            <p className="mt-1 text-muted">
              {lead.hidden_reason ? `السبب: ${lead.hidden_reason}` : "بلا سبب مسجل."}
            </p>
          </div>
        )}

        <section className="flex flex-col gap-4">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">
            معلومات الطلب الأساسية
          </h3>
          <DetailFieldList>
            <DetailField label="التخصص">
              {lead.category?.name || "-"}
            </DetailField>
            <DetailField label="المنطقة">
              {lead.area?.name || "-"}
            </DetailField>
            <DetailField label="رقم العميل" dir="ltr" className="text-right">
              <span className="inline-flex items-center gap-1">
                {lead.customer_phone}
                <CopyPhoneButton phone={lead.customer_phone} label="نسخ رقم العميل" />
              </span>
            </DetailField>
          </DetailFieldList>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">
            وصف الطلب
          </h3>
          <div className="break-words rounded-lg bg-accent/5 p-4 text-sm leading-relaxed text-foreground">
            {lead.description || "لا يوجد وصف."}
          </div>
          {lead.image_urls.length > 0 && (
            <LeadImageGallery images={lead.image_urls} alt="صور مشكلة الطلب" />
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">
            ردود الصنايعية ({toArabicDigits(responses.length)})
          </h3>
          {responsesLoading ? (
            <p className="text-sm text-muted">جاري تحميل الردود...</p>
          ) : responses.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-accent/5 p-4 text-sm text-muted">
              <IconInbox className="h-5 w-5 shrink-0" />
              لا توجد ردود من صنايعية على هذا الطلب بعد.
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {responses.map((response) => (
                <li
                  key={response.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {response.craftsman?.slug ? (
                      <Link
                        href={craftsmanHref(response.craftsman.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-base font-bold text-foreground hover:text-accent hover:underline"
                      >
                        {response.craftsman.name}
                      </Link>
                    ) : (
                      <span className="truncate text-base font-bold text-foreground">
                        {response.craftsman?.name || "صنايعي محذوف"}
                      </span>
                    )}
                    {response.craftsman?.verified && <VerifiedBadge />}
                  </div>
                  <div className="flex items-center gap-2">
                    {response.craftsman?.phone && (
                      <>
                        <a
                          href={`tel:${response.craftsman.phone}`}
                          dir="ltr"
                          className="text-sm text-muted hover:text-accent"
                        >
                          {response.craftsman.phone}
                        </a>
                        <CopyPhoneButton
                          phone={response.craftsman.phone}
                          label={`نسخ رقم ${response.craftsman.name}`}
                        />
                        <a
                          href={whatsappHref(
                            response.craftsman.whatsapp ?? response.craftsman.phone,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`مراسلة ${response.craftsman.name} على واتساب`}
                          title="مراسلة واتساب"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-action/10 hover:text-action"
                        >
                          <IconWhatsApp className="h-5 w-5" />
                        </a>
                      </>
                    )}
                    <time
                      dateTime={response.created_at}
                      className="text-sm text-muted"
                    >
                      <RelativeTime
                        value={response.created_at}
                        mode="past"
                        initial={toArabicDigits(response.created_at.slice(0, 10))}
                      />
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">
            التواريخ
          </h3>
          <DetailFieldList>
            <DetailField label="تاريخ الإنشاء">
              <time dateTime={lead.created_at}>
                <RelativeTime
                  value={lead.created_at}
                  mode="past"
                  initial={toArabicDigits(lead.created_at.slice(0, 10))}
                />
              </time>
            </DetailField>
            <DetailField label="تاريخ التحديث">
              <time dateTime={lead.updated_at}>
                <RelativeTime
                  value={lead.updated_at}
                  mode="past"
                  initial={toArabicDigits(lead.updated_at.slice(0, 10))}
                />
              </time>
            </DetailField>
            <DetailField label="تاريخ الإنتهاء">
              <time dateTime={lead.expires_at}>
                <RelativeTime
                  value={lead.expires_at}
                  mode="remaining"
                  initial={toArabicDigits(lead.expires_at.slice(0, 10))}
                />
              </time>
            </DetailField>
            {lead.claimed_at && (
              <DetailField label="تاريخ الاستلام">
                <time dateTime={lead.claimed_at}>
                  <RelativeTime
                    value={lead.claimed_at}
                    mode="past"
                    initial={toArabicDigits(lead.claimed_at.slice(0, 10))}
                  />
                </time>
              </DetailField>
            )}
          </DetailFieldList>
        </section>

        <section className="mt-4 flex flex-col gap-3 pt-4 border-t border-border">
          {lead.hidden ? (
            <AdminButton
              type="button"
              variant="outline"
              disabled={isHideBusy}
              onClick={() => onUnhide(lead)}
              className="text-emerald-600 hover:text-emerald-700 justify-start"
            >
              <IconEye className="mr-2 h-5 w-5" />
              إظهار الطلب من جديد
            </AdminButton>
          ) : (
            <AdminButton
              type="button"
              variant="outline"
              disabled={isHideBusy}
              onClick={() => onHide(lead)}
              className="text-amber-600 hover:text-amber-700 justify-start"
            >
              <IconEyeOff className="mr-2 h-5 w-5" />
              إخفاء الطلب
            </AdminButton>
          )}
          <AdminButton
            type="button"
            variant="outlineDanger"
            disabled={isDeleteBusy}
            onClick={() => onDelete(lead)}
            className="justify-start"
          >
            <IconTrash className="mr-2 h-5 w-5" />
            حذف الطلب نهائياً
          </AdminButton>
        </section>
      </div>
    </Drawer>
  );
}
