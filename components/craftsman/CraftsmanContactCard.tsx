import type { Category, Craftsman } from "@/lib/data/craftsmen";
import type { RatingSummary } from "@/lib/db/reviews";
import { ActionButtons } from "@/components/shared/ui/ActionButtons";
import { CopyPhoneButton } from "@/components/shared/ui/CopyPhoneButton";
import { RatingBadge } from "@/components/shared/ui/RatingBadge";
import { ShareButtons } from "@/components/craftsman/ShareButtons";
import { IconPlus, IconShieldCheck } from "@/components/shared/icons";
import { ButtonLink } from "@/components/shared/ui/Button";

interface CraftsmanContactCardProps {
  craftsman: Craftsman;
  category?: Category;
  ratingSummary?: RatingSummary;
  className?: string;
}

export function CraftsmanContactCard({
  craftsman,
  category,
  ratingSummary,
  className = "",
}: CraftsmanContactCardProps) {
  const requestLeadParams = new URLSearchParams();
  const categorySlug = category?.slug ?? craftsman.category;
  if (categorySlug) requestLeadParams.set("category", categorySlug);
  if (craftsman.area) requestLeadParams.set("area", craftsman.area);
  const requestLeadHref = `/request/new${requestLeadParams.toString() ? `?${requestLeadParams.toString()}` : ""}`;

  return (
    <div
      className={`flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-card xl:p-6 ${className}`}
    >
      {/* رأس كارت الاتصال: شارة الجاهزية */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-action/10 px-3 py-1 text-xs font-bold text-action">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-action opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-action" />
          </span>
          متاح للتواصل المباشر
        </span>
        {craftsman.verified && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
            <IconShieldCheck className="h-4 w-4" />
            بيانات موثقة
          </span>
        )}
      </div>

      {/* رقم الهاتف والنسخ السريع */}
      <div className="rounded-2xl border border-border/70 bg-background/60 p-3.5 text-center">
        <span className="block text-xs font-medium text-muted mb-1">
          رقم الهاتف المباشر
        </span>
        <div className="flex items-center justify-center gap-2">
          <bdi
            className="font-heading text-xl font-extrabold tracking-wide text-foreground"
            dir="ltr"
          >
            {craftsman.phone}
          </bdi>
          <CopyPhoneButton phone={craftsman.phone} iconOnly size="sm" />
        </div>
      </div>

      {/* التقييم الإجمالي */}
      <div className="flex justify-center">
        <RatingBadge
          average={ratingSummary?.average ?? 0}
          count={ratingSummary?.totalReviews ?? 0}
        />
      </div>

      {/* أزرار الاتصال الكبيرة الفورية (اتصل + واتساب) */}
      <ActionButtons
        phone={craftsman.phone}
        whatsapp={craftsman.whatsapp}
        size="lg"
        craftsmanId={craftsman.id}
        craftsmanSlug={craftsman.slug}
        craftsmanName={craftsman.name}
        categoryName={category?.name}
        categorySlug={category?.slug}
      />

      {/* خيار طلب صنايعي بالتخصص والمنطقة عبر المنصة */}
      <ButtonLink
        href={requestLeadHref}
        variant="outline"
        size="md"
        className="w-full border-accent/40 bg-accent/5 text-accent hover:bg-accent hover:text-white transition-all active:scale-[0.98] font-bold"
      >
        <IconPlus className="h-4 w-4" />
        <span>اطلب صنايعي في هذا التخصص</span>
      </ButtonLink>

      {/* رسالة طمأنينة وأزرار المشاركة */}
      <div className="border-t border-border/70 pt-3 flex flex-col gap-2.5">
        <p className="text-center text-xs text-muted leading-tight">
          اتصال وتواصل مجاني 100% — بدون وسيط أو عمولة
        </p>
        <div className="flex justify-center">
          <ShareButtons slug={craftsman.slug} name={craftsman.name} size="sm" />
        </div>
      </div>
    </div>
  );
}
