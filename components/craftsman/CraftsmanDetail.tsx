import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import type { RatingSummary } from "@/lib/db/reviews";
import { CategoryBadge } from "@/components/shared/ui/CategoryBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ActionButtons } from "@/components/shared/ui/ActionButtons";
import { CopyPhoneButton } from "@/components/shared/ui/CopyPhoneButton";
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
import { categoryHref } from "@/lib/utils/url";

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
        className="flex flex-wrap items-center gap-1 text-sm text-muted"
      >
        <Link
          href="/"
          className="font-bold transition-colors hover:text-accent"
        >
          الرئيسية
        </Link>
        <span aria-hidden>·</span>
        <Link
          href={categoryHref(craftsman.category)}
          className="font-bold transition-colors hover:text-accent"
        >
          {category?.name ?? "التصنيف"}
        </Link>
        <span aria-hidden>·</span>
        <span className="truncate font-bold text-foreground">
          {craftsman.name}
        </span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        {craftsman.image ? (
          <div className="relative h-64 sm:h-80">
            <Image
              src={craftsman.image}
              alt={craftsman.name}
              fill
              priority
              sizes="(min-width: 640px) 56rem, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center bg-linear-to-br from-accent/10 via-card to-accent/10 sm:h-52">
            <CraftsmanAvatar
              name={craftsman.name}
              className="h-24 w-24 rounded-2xl shadow-card sm:h-28 sm:w-28"
              textClassName="text-4xl sm:text-5xl"
            />
          </div>
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 flex-1 font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
              {craftsman.name}
            </h1>
            {craftsman.verified && <VerifiedBadge />}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {category && <CategoryBadge category={category} />}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-sm font-bold text-muted">
              <IconPin className="h-4 w-4 shrink-0" />
              {craftsman.area}
            </span>
          </div>

          <div className="mt-5 hidden flex-col gap-4 border-t border-border pt-5 sm:flex">
            <p className="flex flex-wrap items-center justify-center gap-1.5 text-base text-muted">
              <span>اتصل مباشرة على</span>
              <bdi className="font-bold text-foreground" dir="ltr">
                {craftsman.phone}
              </bdi>
              <CopyPhoneButton phone={craftsman.phone} iconOnly />
            </p>
            <div className="flex justify-center">
              <RatingBadge
                average={ratingSummary?.average ?? 0}
                count={ratingSummary?.totalReviews ?? 0}
              />
            </div>
            <ActionButtons
              phone={craftsman.phone}
              whatsapp={craftsman.whatsapp}
              size="lg"
              craftsmanSlug={craftsman.slug}
              craftsmanName={craftsman.name}
              categoryName={category?.name}
              categorySlug={category?.slug}
            />
            <div className="flex justify-center">
              <ShareButtons slug={craftsman.slug} name={craftsman.name} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <SectionTitle
          eyebrow="نبذة سريعة"
          icon={<IconUser className="h-4 w-4" />}
          title="عن الصنايعي وشغله"
        />
        <p className="text-base leading-relaxed text-muted">
          {craftsman.description}
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
        />
      </Suspense>

      <section className="rounded-3xl border border-border bg-background/60 p-4 sm:p-5">
        <p className="flex items-start gap-2 text-sm text-muted">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <span className="text-sm">
            الأرقام بنراجعها بنفسنا للتأكد إنها شغالة.
          </span>
        </p>
        <div className="mt-3 flex justify-start ps-7">
          <ButtonLink
            href={`/report?craftsman=${encodeURIComponent(craftsman.name)}`}
            variant="ghost"
          >
            إبلاغ عن بيانات غلط
          </ButtonLink>
        </div>
      </section>

      <section aria-label="مشاركة" className="flex justify-center sm:hidden">
        <ShareButtons slug={craftsman.slug} name={craftsman.name} />
      </section>

      <StickyCallBar
        phone={craftsman.phone}
        whatsapp={craftsman.whatsapp}
        craftsmanSlug={craftsman.slug}
        craftsmanName={craftsman.name}
        categoryName={category?.name}
        categorySlug={category?.slug}
      />
    </div>
  );
}
