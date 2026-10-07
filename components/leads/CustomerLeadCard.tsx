import { CheckCircle, Clock, MapPin, Phone, ShieldAlert, Star, Timer } from "lucide-react";
import { MAX_LEAD_RESPONSES, type CustomerLead } from "@/lib/db/leads";
import { LeadActions } from "@/components/leads/LeadActions";
import { LeadCompleteButton } from "@/components/leads/LeadCompleteButton";
import { LeadRenewButton } from "@/components/leads/LeadRenewButton";
import { RelativeTime } from "@/components/leads/RelativeTime";
import { LeadImageGallery } from "@/components/leads/LeadImageGallery";
import { Badge } from "@/components/shared/ui/Badge";
import { ButtonAnchor } from "@/components/shared/ui/Button";
import { IconWhatsApp } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import { formatRelativePast, formatRemainingUntil, telHref } from "@/lib/utils/time";
import { craftsmanHref, whatsappHref } from "@/lib/utils/url";
import Link from "next/link";

const STATUS_BADGES: Record<
  Exclude<CustomerLead["status"], "claimed">,
  { label: string; className: string }
> = {
  open: { label: "مفتوح (جاري البحث)", className: "border-amber-500/40 bg-amber-500/10 text-amber-500" },
  cancelled: { label: "ملغى", className: "border-danger/40 bg-danger/10 text-danger" },
  completed: { label: "تم إنجاز الشغل", className: "border-blue-500/40 bg-blue-500/10 text-blue-500" },
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
            "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
        }
      : STATUS_BADGES[lead.status];
  const accepting =
    lead.status === "claimed" || (lead.status === "open" && lead.responses.length > 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* رأس الكارت: التخصص + حالة الطلب + الوصف */}
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex shrink-0 items-center rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-sm font-bold text-accent">
            {lead.categoryName}
          </span>
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-sm font-bold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <h3 className="line-clamp-3 break-words font-heading text-base font-bold leading-relaxed sm:text-lg">
          {lead.description}
        </h3>

        {lead.imageUrls.length > 0 && (
          <LeadImageGallery images={lead.imageUrls} alt={`صور طلب ${lead.categoryName ?? "الصيانة"}`} />
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {lead.areaName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <RelativeTime
              value={lead.createdAt}
              mode="past"
              initial={formatRelativePast(lead.createdAt)}
            />
          </span>
          {lead.status === "open" && (
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <Timer className="h-4 w-4" />
              <RelativeTime
                value={lead.expiresAt}
                mode="remaining"
                initial={formatRemainingUntil(lead.expiresAt)}
              />
            </span>
          )}
        </div>
      </div>

      {/* قسم الردود — بخلفية منفصلة مثل تذييل كروت الدليل */}
      <div className="border-t border-border bg-background/50 p-4 sm:p-5">
        {lead.hidden ? (
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
            <ShieldAlert className="h-5 w-5 shrink-0 text-danger" />
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-base font-bold">
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

            {accepting && <LeadCompleteButton leadId={lead.id} />}
            {lead.status === "expired" && (
              <div className="mt-4">
                <LeadRenewButton leadId={lead.id} />
              </div>
            )}
          </>
        )}

        {lead.responses.length > 0 ? (
          <div className="mt-4 space-y-3">
            {lead.responses.map((res) => (
              <div
                key={res.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
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
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-muted">
                      <Star className="h-3.5 w-3.5 shrink-0 fill-current text-amber-500" />
                      {res.craftsman.averageRating?.toFixed(1) ?? "0.0"}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <ButtonAnchor
                    href={telHref(res.craftsman.phone)}
                    aria-label={`اتصل بـ ${res.craftsman.name}`}
                    variant="action"
                    size="sm"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    <Phone className="h-4 w-4" />
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
                    className="w-full shrink-0 sm:w-auto"
                  >
                    <IconWhatsApp className="h-4 w-4" />
                    واتساب
                  </ButtonAnchor>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            {lead.status === "open"
              ? "جاري إرسال الإشعارات للصنايعية، يرجى الانتظار..."
              : "لم يرد أي صنايعي على هذا الطلب."}
          </p>
        )}
      </div>
    </article>
  );
}
