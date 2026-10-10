import { Drawer } from "@/components/admin/Drawer";
import { DetailField, DetailFieldList } from "@/components/admin/ui/DetailField";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { CopyPhoneButton } from "@/components/admin/ui/CopyPhoneButton";
import { LeadImageGallery } from "@/components/leads/LeadImageGallery";
import { RelativeTime } from "@/components/leads/RelativeTime";
import { craftsmanHref, whatsappHref } from "@/lib/utils/url";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import {
  IconEye,
  IconEyeOff,
  IconInbox,
  IconMapPin,
  IconPhone,
  IconTrash,
  IconWhatsApp,
} from "@/components/shared/icons";
import type { AdminLeadResponseRow, AdminLeadRow } from "@/lib/db/admin";
import { leadStatusInfo } from "./leadStatus";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast, formatRemainingUntil, telHref } from "@/lib/utils/time";

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
    <Drawer open={open} onClose={onClose} title="تفاصيل طلب العميل">
      <div className={`flex flex-col gap-6 p-4 md:p-6 ${isBusy ? "pointer-events-none opacity-50" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant={statusInfo.variant}>{statusInfo.label}</StatusBadge>
          {lead.hidden && <StatusBadge variant="rejected">مخفي من الإدارة</StatusBadge>}
        </div>

        {lead.hidden && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed">
            <p className="font-bold text-foreground">
              تم إخفاء هذا الطلب
              {lead.hidden_at && (
                <>
                  {" "}منذ{" "}
                  <RelativeTime
                    value={lead.hidden_at}
                    mode="past"
                    initial={formatRelativePast(lead.hidden_at)}
                  />
                </>
              )}
            </p>
            <p className="mt-1 text-muted">
              {lead.hidden_reason ? `سبب الإخفاء: ${lead.hidden_reason}` : "لم يتم تسجيل سبب محدد."}
            </p>
          </div>
        )}

        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-sm font-bold text-foreground border-b border-border pb-2">
            معلومات الطلب الأساسية
          </h3>
          <DetailFieldList>
            <DetailField label="التخصص">
              <span className="font-bold text-foreground">
                {lead.category?.name || "تخصص غير محدد"}
              </span>
            </DetailField>
            <DetailField label="المنطقة">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <IconMapPin className="h-4 w-4 text-accent" />
                {lead.area?.name || "السويس"}
              </span>
            </DetailField>
            <DetailField label="رقم العميل" dir="ltr" className="text-right">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={telHref(lead.customer_phone)}
                  className="font-mono text-sm font-bold text-accent hover:underline"
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-action/15 px-2.5 py-1 text-xs font-bold text-action hover:bg-action/25 transition-colors"
                >
                  <IconWhatsApp className="h-3.5 w-3.5" />
                  <span>مراسلة واتساب</span>
                </a>
              </div>
            </DetailField>
          </DetailFieldList>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-sm font-bold text-foreground border-b border-border pb-2">
            وصف الطلب والمشكلة
          </h3>
          <div className="break-words rounded-xl border border-border/60 bg-accent/5 p-4 text-sm leading-relaxed text-foreground">
            {lead.description || "لا يوجد وصف مدخل."}
          </div>
          {lead.image_urls.length > 0 && (
            <div className="pt-1">
              <LeadImageGallery images={lead.image_urls} alt="صور مشكلة الطلب" />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-heading text-sm font-bold text-foreground">
              ردود واستجابة الصنايعية
            </h3>
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
              {toArabicDigits(responses.length)}/٣ ردود
            </span>
          </div>

          {responsesLoading ? (
            <p className="text-sm text-muted">جاري تحميل الردود...</p>
          ) : responses.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-accent/5 p-4 text-sm text-muted">
              <IconInbox className="h-5 w-5 shrink-0 text-accent" />
              <span>لا توجد ردود من صنايعية على هذا الطلب حتى الآن.</span>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
              {responses.map((response) => (
                <li
                  key={response.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {response.craftsman?.slug ? (
                      <Link
                        href={craftsmanHref(response.craftsman.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm font-bold text-foreground hover:text-accent hover:underline"
                      >
                        {response.craftsman.name}
                      </Link>
                    ) : (
                      <span className="truncate text-sm font-bold text-foreground">
                        {response.craftsman?.name || "صنايعي محذوف"}
                      </span>
                    )}
                    {response.craftsman?.verified && <VerifiedBadge />}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {response.craftsman?.phone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={telHref(response.craftsman.phone)}
                          dir="ltr"
                          className="font-mono text-xs font-bold text-muted hover:text-accent hover:underline"
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
                            `السلام عليكم ${response.craftsman.name}، بخصوص ردك على طلب العميل في دليل الصنايعية`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`مراسلة ${response.craftsman.name} على واتساب`}
                          title="مراسلة واتساب"
                          className="inline-flex items-center gap-1 rounded-lg bg-action/15 px-2 py-1 text-xs font-semibold text-action hover:bg-action/25 transition-colors"
                        >
                          <IconWhatsApp className="h-3.5 w-3.5" />
                          <span>واتساب</span>
                        </a>
                      </div>
                    )}
                    <span className="text-xs text-muted">
                      <RelativeTime
                        value={response.created_at}
                        mode="past"
                        initial={formatRelativePast(response.created_at)}
                      />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-sm font-bold text-foreground border-b border-border pb-2">
            التواريخ والمواعيد
          </h3>
          <DetailFieldList>
            <DetailField label="تاريخ النشر">
              <span className="text-sm font-medium text-foreground">
                <RelativeTime
                  value={lead.created_at}
                  mode="past"
                  initial={formatRelativePast(lead.created_at)}
                />
              </span>
            </DetailField>
            <DetailField label="تاريخ التحديث">
              <span className="text-sm font-medium text-foreground">
                <RelativeTime
                  value={lead.updated_at}
                  mode="past"
                  initial={formatRelativePast(lead.updated_at)}
                />
              </span>
            </DetailField>
            <DetailField label="صلاحية الطلب">
              <span className="text-sm font-medium text-foreground">
                <RelativeTime
                  value={lead.expires_at}
                  mode="remaining"
                  initial={formatRemainingUntil(lead.expires_at)}
                />
              </span>
            </DetailField>
            {lead.claimed_at && (
              <DetailField label="تاريخ أول استلام">
                <span className="text-sm font-medium text-foreground">
                  <RelativeTime
                    value={lead.claimed_at}
                    mode="past"
                    initial={formatRelativePast(lead.claimed_at)}
                  />
                </span>
              </DetailField>
            )}
          </DetailFieldList>
        </section>

        <section className="mt-2 flex flex-col gap-3 pt-4 border-t border-border">
          {lead.hidden ? (
            <AdminButton
              type="button"
              variant="outlineAction"
              disabled={isHideBusy}
              onClick={() => onUnhide(lead)}
              className="justify-start"
            >
              <IconEye className="me-2 h-5 w-5" />
              إظهار الطلب من جديد
            </AdminButton>
          ) : (
            <AdminButton
              type="button"
              variant="outlineWarning"
              disabled={isHideBusy}
              onClick={() => onHide(lead)}
              className="justify-start"
            >
              <IconEyeOff className="me-2 h-5 w-5" />
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
            <IconTrash className="me-2 h-5 w-5" />
            حذف الطلب نهائياً
          </AdminButton>
        </section>
      </div>
    </Drawer>
  );
}
