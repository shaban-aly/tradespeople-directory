import {
  IconCheckCircle,
  IconClock,
  IconMapPin,
  IconPhone,
  IconRadio,
  IconRotateCcw,
  IconShieldAlert,
  IconStar,
  IconTimer,
  IconWhatsApp,
} from "@/components/shared/icons";
import { MAX_LEAD_RESPONSES, type CustomerLead } from "@/lib/db/leads";
import { LeadActions } from "@/components/leads/LeadActions";
import { LeadCompleteButton } from "@/components/leads/LeadCompleteButton";
import { LeadRenewButton } from "@/components/leads/LeadRenewButton";
import { LeadSlotsTracker } from "@/components/leads/LeadSlotsTracker";
import { RelativeTime } from "@/components/leads/RelativeTime";
import { LeadImageGallery } from "@/components/leads/LeadImageGallery";
import { Badge } from "@/components/shared/ui/Badge";
import { ButtonAnchor, ButtonLink } from "@/components/shared/ui/Button";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast, formatRemainingUntil, telHref } from "@/lib/utils/time";
import { craftsmanHref, whatsappHref } from "@/lib/utils/url";
import Link from "next/link";

const STATUS_BADGES: Record<
  Exclude<CustomerLead["status"], "claimed">,
  { label: string; className: string }
> = {
  open: { label: "مفتوح (جاري البحث)", className: "border-warning/40 bg-warning/10 text-warning" },
  cancelled: { label: "ملغى", className: "border-danger/40 bg-danger/10 text-danger" },
  completed: { label: "تم إنجاز الشغل", className: "border-accent/40 bg-accent/10 text-accent" },
  expired: { label: "منتهي الصلاحية", className: "border-border bg-muted/15 text-muted" },
};

export function CustomerLeadCard({ lead }: { lead: CustomerLead }) {
  const claimedLabel = `اكتملت العروض (${toArabicDigits(lead.responses.length)}/${toArabicDigits(MAX_LEAD_RESPONSES)})`;
  const badge = lead.hidden
    ? {
        label: "موقوف من الإدارة",
        className: "border-danger/40 bg-danger/10 text-danger",
      }
    : lead.status === "claimed"
      ? {
          label: claimedLabel,
          className:
            "border-action/40 bg-action/10 text-action",
        }
      : STATUS_BADGES[lead.status];
  const accepting =
    lead.status === "claimed" || (lead.status === "open" && lead.responses.length > 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* رأس الكارت: التخصص + حالة الطلب + إجراء طلب مماثل + الوصف */}
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex shrink-0 items-center rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-sm font-bold text-accent">
            {lead.categoryName}
          </span>
          <div className="flex items-center gap-2">
            {["completed", "expired", "cancelled"].includes(lead.status) && (
              <ButtonLink
                href={`/request/new?category=${encodeURIComponent(lead.categoryName ?? "")}&area=${encodeURIComponent(lead.areaName ?? "")}`}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-bold shrink-0"
                title="إنشاء طلب صيانة جديد بنفس التخصص والمنطقة"
              >
                <IconRotateCcw className="h-3.5 w-3.5 text-muted" />
                <span>طلب مماثل</span>
              </ButtonLink>
            )}
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-sm font-bold ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
        </div>

        <h3 className="line-clamp-3 break-words font-heading text-base font-bold leading-relaxed sm:text-lg">
          {lead.description}
        </h3>

        {lead.imageUrls.length > 0 && (
          <LeadImageGallery images={lead.imageUrls} alt={`صور طلب ${lead.categoryName ?? "الصيانة"}`} />
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <IconMapPin className="h-4 w-4" />
            {lead.areaName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconClock className="h-4 w-4" />
            <RelativeTime
              value={lead.createdAt}
              mode="past"
              initial={formatRelativePast(lead.createdAt)}
            />
          </span>
          {lead.status === "open" && (
            <span className="inline-flex items-center gap-1.5 font-bold text-warning">
              <IconTimer className="h-4 w-4" />
              <RelativeTime
                value={lead.expiresAt}
                mode="remaining"
                initial={formatRemainingUntil(lead.expiresAt)}
              />
            </span>
          )}
        </div>
      </div>

      {/* قسم الردود — متتبع المقاعد الثلاثة وقائمة الفنيين وزر الإنهاء */}
      <div className="border-t border-border bg-background/50 p-4 sm:p-5">
        {lead.hidden ? (
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
            <IconShieldAlert className="h-5 w-5 shrink-0 text-danger" />
            <div className="space-y-1 text-sm leading-relaxed">
              <p className="font-bold text-foreground">
                تم إيقاف هذا الطلب من الإدارة مؤقتاً ولن يصل لصنايعية جدد.
              </p>
              <p className="text-muted">
                {lead.responses.length > 0
                  ? "يمكنك التواصل مع الصنايعية الذين ردّوا بالأسفل، أو أضف طلباً جديداً بتفاصيل أوضح."
                  : "يمكنك إضافة طلب جديد بتفاصيل أوضح وسيُراجَع قبل النشر."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-base font-bold text-foreground">
                الصنايعية المتاحين
                <Badge variant="accent" size="sm">
                  {toArabicDigits(lead.responses.length)}/{toArabicDigits(MAX_LEAD_RESPONSES)}
                </Badge>
              </h4>
              {lead.status === "open" && (
                <LeadActions
                  leadId={lead.id}
                  description={lead.description}
                  hasResponses={lead.responses.length > 0}
                  initialImages={lead.imageUrls}
                />
              )}
            </div>

            {/* متتبع المقاعد الثلاثة البصري */}
            <LeadSlotsTracker responses={lead.responses} status={lead.status} />

            {/* محتوى الردود أو بطاقة البث الحي */}
            {lead.responses.length > 0 ? (
              <div className="mt-4 space-y-3">
                {lead.responses.map((res) => (
                  <div
                    key={res.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-accent/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={res.craftsman.imageUrl || "/placeholder.png"}
                        alt={res.craftsman.name}
                        className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-bold">
                          {res.craftsman.slug ? (
                            <Link
                              href={craftsmanHref(res.craftsman.slug)}
                              className="truncate hover:text-accent hover:underline"
                            >
                              {res.craftsman.name}
                            </Link>
                          ) : (
                            res.craftsman.name
                          )}
                          {res.craftsman.verified && (
                            <IconCheckCircle className="h-4 w-4 shrink-0 text-action" />
                          )}
                        </p>
                        <p className="flex items-center gap-1 text-sm text-muted">
                          <IconStar className="h-3.5 w-3.5 shrink-0 fill-current text-warning" />
                          {res.craftsman.averageRating?.toFixed(1) ?? "0.0"}
                        </p>
                      </div>
                    </div>
                    {/* أزرار الاتصال والمراسلة: مدمجة أفقياً على الموبايل لتوفير الارتفاع الرأسي */}
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:w-auto">
                      <ButtonAnchor
                        href={telHref(res.craftsman.phone)}
                        aria-label={`اتصل بـ ${res.craftsman.name}`}
                        variant="action"
                        size="sm"
                        className="w-full shrink-0 sm:w-auto font-bold"
                      >
                        <IconPhone className="h-4 w-4" />
                        اتصل الآن
                      </ButtonAnchor>
                      <ButtonAnchor
                        href={whatsappHref(
                          res.craftsman.whatsapp ?? res.craftsman.phone,
                          `السلام عليكم ${res.craftsman.name}، بخصوص طلبي على دليل الصنايعية: ${lead.description.slice(0, 120)}`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`مراسلة ${res.craftsman.name} على واتساب`}
                        variant="outline"
                        size="sm"
                        className="w-full shrink-0 sm:w-auto font-bold"
                      >
                        <IconWhatsApp className="h-4 w-4" />
                        واتساب
                      </ButtonAnchor>
                    </div>
                  </div>
                ))}
              </div>
            ) : lead.status === "open" ? (
              /* بطاقة البث الحي الهادئة عند انتظار أول استجابة */
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/5 p-4 text-sm leading-relaxed">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent mt-0.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/25 opacity-75" />
                  <IconRadio className="relative h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-foreground">
                    جاري إرسال الإشعارات لفنيي {lead.areaName ?? "السويس"} الآن...
                  </p>
                  <p className="text-muted text-xs sm:text-sm">
                    بمجرد موافقة أول فني على طلبك، ستظهر بياناته ورقم هاتفه هنا فوراً للتواصل المباشر دون وسيط.
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                لم يرد أي صنايعي على هذا الطلب خلال مهلة النشر.
              </p>
            )}

            {/* خاتمة قسم الردود: زر إنجاز الشغل يوضع منطقياً بعد رؤية الفنيين والتواصل معهم */}
            {accepting && (
              <div className="mt-5 border-t border-border/50 bg-card/60 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    هل اتفقت مع أحد الفنيين وتم إنجاز الشغل؟
                  </p>
                  <p className="text-xs text-muted">
                    تأكيد إنجاز الشغل يغلق الطلب نهائياً ويُشعر الصنايعية بانتهاء المهمة.
                  </p>
                </div>
                <LeadCompleteButton leadId={lead.id} className="mt-0" />
              </div>
            )}

            {lead.status === "expired" && (
              <div className="mt-4 border-t border-border/50 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-muted">
                  انتهت مهلة هذا الطلب (24 ساعة). يمكنك تجديده لإعادة إشعار الفنيين في المنطقة.
                </p>
                <LeadRenewButton leadId={lead.id} />
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
