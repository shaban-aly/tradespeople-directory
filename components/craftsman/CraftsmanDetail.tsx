import { Suspense } from "react";
import Link from "next/link";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import type { RatingSummary } from "@/lib/db/reviews";
import { CategoryBadge } from "@/components/shared/ui/CategoryBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { RatingBadge } from "@/components/shared/ui/RatingBadge";
import { ButtonLink } from "@/components/shared/ui/Button";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { SectionTitle } from "@/components/shared/ui/SectionTitle";
import { IconAlert, IconPin, IconUser } from "@/components/shared/icons";
import { SocialLinks } from "@/components/craftsman/SocialLinks";
import { StickyCallBar } from "@/components/craftsman/StickyCallBar";
import { ShareButtons } from "@/components/craftsman/ShareButtons";
import { ViewTracker } from "@/components/craftsman/ViewTracker";
import { CraftsmanReviewsSection } from "@/components/craftsman/CraftsmanReviewsSection";
import { CraftsmanHeroImage } from "@/components/craftsman/CraftsmanHeroImage";
import { categoryHref } from "@/lib/utils/url";
import { ViewsCounter } from "@/components/craftsman/ViewsCounter";
import {
  IMAGE_ASPECT,
  IMAGE_SIZES,
  supabaseBlurUrl,
  withImageAspect,
} from "@/lib/utils/image-transform";

export function CraftsmanDetail({
  craftsman,
  category,
  ratingSummary,
}: {
  craftsman: Craftsman;
  category?: Category;
  ratingSummary?: RatingSummary;
}) {
  return (
    <div className="flex flex-col gap-6">
      <ViewTracker slug={craftsman.slug} categorySlug={category?.slug} area={craftsman.area} />
      <nav
        aria-label="مسار التنقل"
        className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-muted"
      >
        <Link
          href="/"
          className="font-medium transition-colors hover:text-accent"
        >
          الرئيسية
        </Link>
        <span aria-hidden className="text-muted/40">·</span>
        <Link
          href={categoryHref(craftsman.category)}
          className="font-medium transition-colors hover:text-accent"
        >
          {category?.name ?? "التصنيف"}
        </Link>
        <span aria-hidden className="text-muted/40">·</span>
        <span
          aria-current="page"
          className="max-w-[200px] truncate font-bold text-foreground sm:max-w-xs md:max-w-md"
        >
          {craftsman.name}
        </span>
      </nav>

      <section
        aria-label={`الملف الشخصي لـ ${craftsman.name}`}
        className="overflow-hidden rounded-3xl border border-border bg-card shadow-card flex flex-col"
      >
        {/* [1] صورة الصنايعي في المنتصف */}
        <Suspense
          fallback={
            craftsman.image ? (
              <div className="relative flex h-64 sm:h-72 md:h-80 w-full items-center justify-center overflow-hidden bg-neutral-900/90">
                <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={supabaseBlurUrl(craftsman.image) ?? craftsman.image}
                    alt=""
                    className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl filter"
                  />
                  <div className="absolute inset-0 bg-black/25 backdrop-blur-xs" />
                </div>
                <div className="relative flex h-full aspect-4/3 items-center justify-center overflow-hidden shadow-2xl">
                  <Image
                    src={withImageAspect(craftsman.image, IMAGE_ASPECT.CARD)}
                    alt={craftsman.name}
                    fill
                    priority
                    sizes={IMAGE_SIZES.HERO}
                    className="object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-44 w-full items-center justify-center bg-linear-to-br from-accent/10 via-card to-accent/10 sm:h-52 md:h-64">
                <CraftsmanAvatar
                  name={craftsman.name}
                  className="h-24 w-24 rounded-2xl shadow-card sm:h-28 sm:w-28"
                  textClassName="text-4xl sm:text-5xl"
                />
              </div>
            )
          }
        >
          <CraftsmanHeroImage
            image={craftsman.image}
            name={craftsman.name}
            avatarPosition={craftsman.avatarPosition}
          />
        </Suspense>

        {/* [2] اسم الصنايعي وشارة التوثيق في المنتصف أسفل الصورة */}
        <div className="flex flex-col items-center justify-center px-6 pt-5 pb-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
              {craftsman.name}
            </h1>
            {craftsman.verified && <VerifiedBadge />}
          </div>
        </div>

        {/* [3] فوتر كارت الهيرو: شريط معلومات التخصص، المنطقة، المشاهدات، وعداد التقييمات */}
        <div className="border-t border-border bg-background/50 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2.5">
            {/* التخصص والمنطقة */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {category && <CategoryBadge category={category} />}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1 text-xs font-bold text-muted">
                <IconPin className="h-3.5 w-3.5 shrink-0" />
                {craftsman.area}
              </span>
            </div>

            {/* المشاهدات وعداد التقييمات */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ViewsCounter craftsmanId={craftsman.id} />
              <RatingBadge
                average={ratingSummary?.average ?? 0}
                count={ratingSummary?.totalReviews ?? 0}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="عن الصنايعي وشغله"
        className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
      >
        <SectionTitle
          icon={<IconUser className="h-5 w-5" />}
          title="عن الصنايعي وشغله"
        />
        <p className="text-base leading-relaxed text-muted whitespace-pre-line">
          {craftsman.description || "لا توجد تفاصيل إضافية مضافة حالياً."}
        </p>
      </section>

      {/* روابط السوشيال ميديا — تجميع وسائل التواصل بجوار أزرار الاتصال */}
      <SocialLinks socialLinks={craftsman.socialLinks} />

      {/* قسم آراء وتقييمات العملاء */}
      <Suspense
        fallback={
          <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-background border border-border" />
            <div className="mt-6 space-y-3 animate-pulse">
              <div className="h-20 rounded-2xl bg-background border border-border" />
              <div className="h-20 rounded-2xl bg-background border border-border" />
            </div>
          </section>
        }
      >
        <CraftsmanReviewsSection
          craftsmanId={craftsman.id}
          craftsmanName={craftsman.name}
          ownerUserId={craftsman.ownerUserId ?? null}
        />
      </Suspense>

      <section
        aria-label="الإبلاغ عن بيانات غير صحيحة"
        className="rounded-3xl border border-border/80 bg-card/60 p-5 shadow-xs sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <IconAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                بيانات اتصال موثوقة ومراجعة
              </h3>
              <p className="mt-0.5 text-sm text-muted leading-relaxed">
                نقوم بمراجعة الأرقام للتأكد إنها شغالة. لو لاحظت أي خطأ ساعدنا بتحديثه.
              </p>
            </div>
          </div>
          <div className="shrink-0 sm:self-center">
            <ButtonLink
              href={`/report?craftsman=${encodeURIComponent(craftsman.name)}`}
              variant="ghost"
              size="sm"
            >
              إبلاغ عن بيانات غير صحيحة
            </ButtonLink>
          </div>
        </div>
      </section>

      <section aria-label="مشاركة الصفحة" className="flex justify-center lg:hidden">
        <ShareButtons slug={craftsman.slug} name={craftsman.name} />
      </section>

      <StickyCallBar
        phone={craftsman.phone}
        whatsapp={craftsman.whatsapp}
        craftsmanId={craftsman.id}
        craftsmanSlug={craftsman.slug}
        craftsmanName={craftsman.name}
        categoryName={category?.name}
        categorySlug={category?.slug}
        area={craftsman.area}
      />
    </div>
  );
}
