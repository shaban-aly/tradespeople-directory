import Link from "next/link";
import type { Category, Craftsman } from "@/lib/data/craftsmen";
import { SafeImage as Image } from "@/components/shared/ui/SafeImage";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { ButtonLink } from "@/components/shared/ui/Button";
import { IconArrow, IconCheck, IconStar, IconUsers } from "@/components/shared/icons";
import { categoryHref, craftsmanHref } from "@/lib/utils/url";
import { IMAGE_ASPECT, withImageAspect } from "@/lib/utils/image-transform";
import { toArabicDigits } from "@/lib/utils/format";

interface CompactRelatedCraftsmenProps {
  craftsmen: Craftsman[];
  category?: Category;
  className?: string;
  maxItems?: number;
}

export function CompactRelatedCraftsmen({
  craftsmen,
  category,
  className = "",
  maxItems = 4,
}: CompactRelatedCraftsmenProps) {
  if (craftsmen.length === 0) return null;

  const displayItems = craftsmen.slice(0, maxItems);

  return (
    <div
      className={`rounded-3xl border border-border bg-card p-4 shadow-card xl:p-5 ${className}`}
    >
      {/* رأس القسم */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <IconUsers className="h-4 w-4" />
          </div>
          <h3 className="font-heading text-sm font-bold text-foreground truncate">
            {category?.name ? `صنايعية آخرون في ${category.name}` : "صناع مقترحون"}
          </h3>
        </div>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent shrink-0">
          {toArabicDigits(craftsmen.length)} متاح
        </span>
      </div>

      {/* قائمة الفنيين البدلاء المدمجة */}
      <div className="flex flex-col gap-2">
        {displayItems.map((c) => (
          <Link
            key={c.id}
            href={craftsmanHref(c.slug)}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/50 p-2.5 transition-all hover:border-accent/50 hover:bg-card hover:shadow-2xs active:scale-[0.99]"
          >
            {/* الصورة والاسم */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-accent/10">
                {c.image ? (
                  <Image
                    src={withImageAspect(c.image, IMAGE_ASPECT.CARD)}
                    alt={c.name}
                    fill
                    sizes="48px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <CraftsmanAvatar name={c.name} className="h-full w-full" textClassName="text-sm" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="truncate font-heading text-xs font-bold text-foreground transition-colors group-hover:text-accent">
                    {c.name}
                  </h4>
                  {c.verified && (
                    <span
                      title="موثق"
                      className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-action text-on-action"
                    >
                      <IconCheck className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span className="truncate">{c.area}</span>
                  {c.rating.average > 0 && (
                    <span className="inline-flex items-center gap-0.5 font-bold text-foreground">
                      <IconStar className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {toArabicDigits(c.rating.average.toFixed(1))}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* سهم الانتقال */}
            <IconArrow className="h-3.5 w-3.5 shrink-0 text-muted/60 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:text-accent" />
          </Link>
        ))}
      </div>

      {/* رابط استعراض باقي التخصص إن وجد */}
      {category && (
        <div className="mt-3 pt-3 border-t border-border">
          <ButtonLink
            href={categoryHref(category.slug)}
            variant="ghost"
            size="sm"
            className="group/btn w-full justify-center text-xs font-bold"
          >
            <span>عرض كل صنايعية {category.name}</span>
            <IconArrow className="h-3.5 w-3.5 text-muted transition-transform duration-200 group-hover/btn:-translate-x-1 group-hover/btn:text-accent" />
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
