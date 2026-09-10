import Link from "next/link";
import Image from "next/image";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { ActionButtons } from "@/components/shared/ui/ActionButtons";
import { CategoryBadge } from "@/components/shared/ui/CategoryBadge";
import { FavoriteButton } from "@/components/shared/ui/FavoriteButton";
import { RecentBadge } from "@/components/shared/ui/RecentBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { craftsmanHref } from "@/lib/utils/url";

function CraftsmanImage({ craftsman }: { craftsman: Craftsman }) {
  if (craftsman.image) {
    return (
      <Image
        src={craftsman.image}
        alt={craftsman.name}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
    );
  }
  return (
    <CraftsmanAvatar
      name={craftsman.name}
      className="h-full w-full"
      textClassName="text-3xl"
    />
  );
}

export function CraftsmanCard({
  craftsman,
  category,
  recent = false,
  reason,
}: {
  craftsman: Craftsman;
  category?: Category;
  recent?: boolean;
  reason?: string;
}) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:border-accent hover:shadow-md">
      <Link href={craftsmanHref(craftsman.slug)} className="flex flex-1 flex-col">
        <div className="relative aspect-4/3 overflow-hidden bg-accent/10">
          <CraftsmanImage craftsman={craftsman} />
          {(craftsman.verified || recent) && (
            <div className="absolute right-2 top-2 flex flex-col items-start gap-1">
              {craftsman.verified && <VerifiedBadge />}
              {recent && <RecentBadge />}
            </div>
          )}
          <span className="absolute bottom-2 right-2 rounded-full border border-border bg-card/90 px-2 py-0.5 text-xs font-bold text-foreground backdrop-blur">
            {craftsman.area}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="truncate font-heading text-base font-bold text-foreground">
            {craftsman.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {category && <CategoryBadge category={category} />}
          </div>
          {reason && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-accent">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="truncate">{reason}</span>
            </div>
          )}
        </div>
      </Link>
      <div className="border-t border-border bg-background/50 p-2">
        <ActionButtons
          size="sm"
          phone={craftsman.phone}
          whatsapp={craftsman.whatsapp}
          craftsmanSlug={craftsman.slug}
          craftsmanName={craftsman.name}
          categoryName={category?.name}
        />
      </div>
      <div className="absolute left-2 top-2 flex flex-col gap-1.5">
        <FavoriteButton slug={craftsman.slug} />
      </div>
    </article>
  );
}