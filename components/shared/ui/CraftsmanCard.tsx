import Link from "next/link";
import Image from "next/image";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { ActionButtons } from "@/components/shared/ui/ActionButtons";
import { CategoryBadge } from "@/components/shared/ui/CategoryBadge";
import { RecentBadge } from "@/components/shared/ui/RecentBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { IconArrow, IconWrench } from "@/components/shared/icons";
import { craftsmanHref } from "@/lib/utils/url";

export function CraftsmanCard({
  craftsman,
  category,
  recent = false,
}: {
  craftsman: Craftsman;
  category?: Category;
  recent?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-md">
      <Link href={craftsmanHref(craftsman.slug)} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-accent/10">
          {craftsman.image ? (
            <Image
              src={craftsman.image}
              alt={craftsman.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-accent">
              <IconWrench className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/90 to-background/0" />
          {(craftsman.verified || recent) && (
            <div className="absolute right-3 top-3 flex flex-col items-start gap-1">
              {craftsman.verified && <VerifiedBadge />}
              {recent && <RecentBadge />}
            </div>
          )}
          <span className="absolute bottom-3 right-3 rounded-full border border-border bg-card/90 px-3 py-1 text-sm font-bold text-foreground backdrop-blur">
            {craftsman.area}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-lg font-bold text-foreground">
              {craftsman.name}
            </h3>
            <IconArrow className="mt-1 h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-accent" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {category && <CategoryBadge category={category} />}
          </div>
          <p className="mt-3 line-clamp-2 text-base leading-relaxed text-muted">
            {craftsman.description}
          </p>
        </div>
      </Link>
      <div className="border-t border-border bg-background/50 p-3">
        <ActionButtons
          phone={craftsman.phone}
          whatsapp={craftsman.whatsapp}
          craftsmanSlug={craftsman.slug}
        />
      </div>
    </article>
  );
}
