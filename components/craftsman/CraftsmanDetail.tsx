import Link from "next/link";
import Image from "next/image";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { CategoryBadge } from "@/components/shared/ui/CategoryBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { ActionButtons } from "@/components/shared/ui/ActionButtons";
import { IconPin, IconWrench } from "@/components/shared/icons";
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
        <div className="relative h-64 bg-gradient-to-br from-accent/10 via-card to-accent/10 sm:h-80">
          {craftsman.image ? (
            <Image
              src={craftsman.image}
              alt={craftsman.name}
              fill
              priority
              sizes="(min-width: 640px) 42rem, 100vw"
              className="object-contain p-3"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-accent">
              <IconWrench className="h-16 w-16" />
            </div>
          )}
          {craftsman.verified && (
            <div className="absolute right-4 top-4">
              <VerifiedBadge />
            </div>
          )}
        </div>
        <div className="p-6 sm:p-8">
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

          <div className="mt-5 hidden flex-col gap-4 border-t border-border pt-5 sm:flex">
            <p className="flex flex-wrap items-center justify-center gap-1.5 text-base text-muted">
              <span>اتصل مباشرة على</span>
              <bdi className="font-bold text-foreground" dir="ltr">
                {craftsman.phone}
              </bdi>
            </p>
            <ActionButtons
              phone={craftsman.phone}
              whatsapp={craftsman.whatsapp}
              size="lg"
              craftsmanSlug={craftsman.slug}
              craftsmanName={craftsman.name}
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

      <section aria-label="مشاركة" className="flex justify-center sm:hidden">
        <ShareButtons slug={craftsman.slug} name={craftsman.name} />
      </section>

      <SocialLinks socialLinks={craftsman.socialLinks} />

      <StickyCallBar
        phone={craftsman.phone}
        whatsapp={craftsman.whatsapp}
        craftsmanSlug={craftsman.slug}
        craftsmanName={craftsman.name}
      />
    </div>
  );
}
