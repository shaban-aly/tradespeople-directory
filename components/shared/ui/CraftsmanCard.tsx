import Link from "next/link";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { ActionButtons } from "@/components/shared/ui/ActionButtons";
import { CategoryBadge } from "@/components/shared/ui/CategoryBadge";
import { FavoriteButton } from "@/components/shared/ui/FavoriteButton";
import { RecentBadge } from "@/components/shared/ui/RecentBadge";
import { RatingBadge } from "@/components/shared/ui/RatingBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { IconMapPin } from "@/components/shared/icons";
import { craftsmanHref } from "@/lib/utils/url";
import { IMAGE_ASPECT, IMAGE_SIZES, withImageAspect } from "@/lib/utils/image-transform";

function CraftsmanImage({
  craftsman,
  priority,
  sizes,
}: {
  craftsman: Craftsman;
  priority?: boolean;
  sizes: string;
}) {
  if (craftsman.image) {
    const posX = craftsman.avatarPosition?.x ?? 50;
    const posY = craftsman.avatarPosition?.y ?? 50;
    const zoom = craftsman.avatarPosition?.zoom ?? 1;
    return (
      <Image
        // نسبة 4:3 = نسبة الحاوية داخل الكارت => يقصّها Supabase على السيرفر
        // (resize=cover) بدل تحميل الصورة كاملة ثم قصّها في المتصفح.
        src={withImageAspect(craftsman.image, IMAGE_ASPECT.CARD)}
        alt={craftsman.name}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        style={{
          objectPosition: `${posX}% ${posY}%`,
          transform: zoom > 1 ? `scale(${zoom})` : undefined,
          transformOrigin: `${posX}% ${posY}%`,
        }}
        loading={priority ? "eager" : "lazy"}
        priority={priority}
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
  priority = false,
  imageSizes = IMAGE_SIZES.CARD,
}: {
  craftsman: Craftsman;
  category?: Category;
  recent?: boolean;
  reason?: string;
  priority?: boolean;
  /** مقاس الصورة الفعلي على الشاشة — الجريد يستخدم الافتراضي، والكاروسيل يمرّر مقاسه */
  imageSizes?: string;
}) {
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-md"
    >
      <Link href={craftsmanHref(craftsman.slug)} className="flex flex-1 flex-col">
        <div className="relative aspect-4/3 overflow-hidden bg-accent/10">
          <CraftsmanImage craftsman={craftsman} priority={priority} sizes={imageSizes} />

          {/* تدرج ظلي سفلي ناعم يبرز شارة المنطقة على أي خلفية صورة */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/45 via-black/10 to-transparent" />

          {(craftsman.verified || recent) && (
            <div className="absolute right-2 top-2 z-10 flex flex-col items-start gap-1">
              {craftsman.verified && <VerifiedBadge />}
              {recent && <RecentBadge />}
            </div>
          )}
          <span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/90 px-2.5 py-0.5 text-xs font-bold text-foreground shadow-2xs backdrop-blur-md">
            <IconMapPin className="h-3 w-3 text-muted shrink-0" />
            <span>{craftsman.area}</span>
          </span>
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-3.5">
          <h3 className="truncate font-heading text-base font-bold text-foreground transition-colors group-hover:text-accent">
            {craftsman.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {category && <CategoryBadge category={category} />}
            <RatingBadge
              average={craftsman.rating.average}
              count={craftsman.rating.totalReviews}
              size="sm"
            />
          </div>
          {reason && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="truncate">{reason}</span>
            </div>
          )}
        </div>
      </Link>
      <div className="border-t border-border bg-background/40 p-2 sm:p-2.5">
        <ActionButtons
          size="sm"
          craftsmanId={craftsman.id}
          phone={craftsman.phone}
          whatsapp={craftsman.whatsapp}
          craftsmanSlug={craftsman.slug}
          craftsmanName={craftsman.name}
          categoryName={category?.name}
          categorySlug={category?.slug}
        />
      </div>
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5">
        <FavoriteButton slug={craftsman.slug} />
      </div>
    </article>
  );
}
