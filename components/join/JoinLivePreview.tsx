import type { Category } from "@/lib/data/craftsmen";
import { CategoryBadge } from "@/components/shared/ui/CategoryBadge";
import { VerifiedBadge } from "@/components/shared/ui/VerifiedBadge";
import { CraftsmanAvatar } from "@/components/shared/ui/CraftsmanAvatar";
import { IconMapPin, IconPhone, IconSparkles, IconWhatsApp } from "@/components/shared/icons";

type JoinLivePreviewProps = {
  name: string;
  category?: Category;
  area: string;
  phone: string;
  whatsapp: string;
  description: string;
  imagePreview: string;
};

export function JoinLivePreview({
  name,
  category,
  area,
  phone,
  whatsapp,
  description,
  imagePreview,
}: JoinLivePreviewProps) {
  const displayName = name.trim() || "اسمك يظهر هنا";
  const displayArea = area.trim() || "حي السويس";
  const displayDescription =
    description.trim() ||
    "نبذة مختصرة عن خبرتك وسنوات عملك والخدمات التي تقدمها ستظهر هنا للعملاء...";

  return (
    <div className="space-y-3">
      {/* رأس المعاينة الحية */}
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-1.5 font-heading text-sm font-bold text-foreground">
          <IconSparkles className="h-4 w-4 text-accent" />
          <span>معاينة كارتك في الدليل</span>
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-action/30 bg-action/10 px-2 py-0.5 text-2xs font-bold text-action">
          <span className="h-1.5 w-1.5 rounded-full bg-action animate-pulse" />
          <span>مباشر</span>
        </span>
      </div>

      {/* الكارت الحي المحاكي لـ CraftsmanCard */}
      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300">
        <div className="relative aspect-4/3 w-full overflow-hidden bg-accent/10">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-500"
            />
          ) : (
            <CraftsmanAvatar
              name={displayName}
              className="h-full w-full"
              textClassName="text-3xl"
            />
          )}

          {/* تدرج ظلي سفلي ناعم يبرز شارة المنطقة */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/50 via-black/15 to-transparent" />

          {/* شارة التوثيق المستهدفة */}
          <div className="absolute right-2 top-2 z-10">
            <VerifiedBadge />
          </div>

          {/* شارة المنطقة */}
          <span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/95 px-2.5 py-0.5 text-xs font-bold text-foreground shadow-2xs backdrop-blur-md">
            <IconMapPin className="h-3 w-3 shrink-0 text-accent" />
            <span>{displayArea}</span>
          </span>
        </div>

        {/* تفاصيل الكارت */}
        <div className="p-3.5 sm:p-4">
          <h3 className="font-heading text-base font-bold text-foreground truncate">
            {displayName}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {category && <CategoryBadge category={category} />}
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent shadow-2xs">
              ★ جديد في الدليل
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-2">
            {displayDescription}
          </p>
        </div>

        {/* أزرار الاتصال التفاعلية المحاكية */}
        <div className="border-t border-border bg-background/40 p-2.5 sm:p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-bold text-on-accent shadow-xs opacity-95">
              <IconPhone className="h-3.5 w-3.5" />
              <span>{phone.trim() ? "اتصال فوري" : "رقم الاتصال"}</span>
            </div>
            <div className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-action px-3 text-xs font-bold text-on-action shadow-xs opacity-95">
              <IconWhatsApp className="h-3.5 w-3.5" />
              <span>{whatsapp.trim() || phone.trim() ? "مراسلة واتساب" : "واتساب"}</span>
            </div>
          </div>
        </div>
      </article>

      <p className="px-1 text-2xs leading-relaxed text-muted">
        هكذا سيظهر كارتك المعتمد لآلاف الزوار عند البحث عن حرفتك في السويس.
      </p>
    </div>
  );
}
