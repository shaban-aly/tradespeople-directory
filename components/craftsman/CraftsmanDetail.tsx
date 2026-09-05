import Link from "next/link";
import Image from "next/image";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CategoryBadge } from "@/components/shared/ui/CategoryBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ActionButtons } from "@/components/shared/ui/ActionButtons";
import { CopyPhoneButton } from "@/components/shared/ui/CopyPhoneButton";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { IconPin, IconAlert } from "@/components/shared/icons";
import { SocialLinks } from "@/components/craftsman/SocialLinks";
import { StickyCallBar } from "@/components/craftsman/StickyCallBar";
import { ShareButtons } from "@/components/craftsman/ShareButtons";
import { ViewTracker } from "@/components/craftsman/ViewTracker";
import { categoryHref } from "@/lib/utils/url";

export function CraftsmanDetail({
  craftsman,
  category,
}: {
  craftsman: Craftsman;
  category?: Category;
}) {
  return (
    <div className="flex flex-col gap-6">
      <ViewTracker slug={craftsman.slug} />
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
        <div className="relative h-64 sm:h-80">
          {craftsman.image ? (
            <>
              <Image
                src={craftsman.image}
                alt={craftsman.name}
                fill
                priority
                sizes="(min-width: 640px) 42rem, 100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
                aria-hidden
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 via-card to-accent/10">
              <CraftsmanAvatar
                name={craftsman.name}
                className="h-28 w-28 rounded-2xl shadow-card"
                textClassName="text-5xl"
              />
            </div>
          )}
          {craftsman.image && (
            <div className="absolute bottom-4 right-4 left-4">
              <h1 className="font-heading text-3xl font-extrabold text-white drop-shadow sm:text-4xl">
                {craftsman.name}
              </h1>
              {category && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <CategoryBadge category={category} />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-sm font-bold text-white backdrop-blur">
                    <IconPin className="h-4 w-4 shrink-0" />
                    {craftsman.area}
                  </span>
                </div>
              )}
            </div>
          )}
          {craftsman.verified && (
            <div className="absolute right-4 top-4">
              <VerifiedBadge />
            </div>
          )}
        </div>
        <div className="p-6 sm:p-8">
          {!craftsman.image && (
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
                  {craftsman.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {category && <CategoryBadge category={category} />}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-sm font-bold text-muted">
                    <IconPin className="h-4 w-4 shrink-0" />
                    {craftsman.area}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 hidden flex-col gap-4 border-t border-border pt-5 sm:flex">
            <p className="flex flex-wrap items-center justify-center gap-1.5 text-base text-muted">
              <span>اتصل مباشرة على</span>
              <bdi className="font-bold text-foreground" dir="ltr">
                {craftsman.phone}
              </bdi>
              <CopyPhoneButton phone={craftsman.phone} iconOnly />
            </p>
            <ActionButtons
              phone={craftsman.phone}
              whatsapp={craftsman.whatsapp}
              size="lg"
              craftsmanSlug={craftsman.slug}
              craftsmanName={craftsman.name}
              categoryName={category?.name}
            />
            <div className="flex justify-center">
              <ShareButtons slug={craftsman.slug} name={craftsman.name} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
          عن الصنايعي
        </h2>
        <p className="text-base leading-relaxed text-muted">
          {craftsman.description}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
        <p className="flex items-start gap-2 text-sm text-muted">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <span>
            الأرقام بنراجعها بنفسنا للتأكد إنها شغالة. لو لقيت رقم اتغير أو مش بيرد، اضغط على &quot;إبلاغ&quot; وهنحدّثه في نفس اليوم.
          </span>
        </p>
      </section>

      <section aria-label="مشاركة" className="flex justify-center sm:hidden">
        <ShareButtons slug={craftsman.slug} name={craftsman.name} />
      </section>

      <SocialLinks socialLinks={craftsman.socialLinks} />

      <StickyCallBar
        phone={craftsman.phone}
        whatsapp={craftsman.whatsapp}
        craftsmanSlug={craftsman.slug}
        craftsmanName={craftsman.name}
        categoryName={category?.name}
      />
    </div>
  );
}
