import Link from "next/link";
import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconChevronLeft, IconUsers } from "@/components/shared/icons";
import { categoryColor } from "@/lib/utils/categoryColor";
import { categoryHref } from "@/lib/utils/url";
import { toArabicDigits } from "@/lib/utils/format";

interface CategoryCardProps {
  category: CategoryWithCount;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const color = categoryColor(category.slug);
  const hasCraftsmen = (category.count ?? 0) > 0;

  return (
    <Link
      href={categoryHref(category.slug)}
      className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
    >
      {/* الصف العلوي: الأيقونة + مؤشر التصفح */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="rounded-2xl p-3 transition-transform duration-300 group-hover:scale-110 shadow-2xs shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
            color,
          }}
        >
          <CategoryIcon name={category.icon} className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/5 text-muted transition-all duration-300 group-hover:bg-accent group-hover:text-on-accent group-hover:-translate-x-1">
          <IconChevronLeft className="h-4 w-4" />
        </div>
      </div>

      {/* تفاصيل التخصص */}
      <div className="mt-4 flex flex-col gap-1">
        <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground transition-colors group-hover:text-accent line-clamp-1">
          {category.name}
        </h3>
        <p className="text-xs text-muted font-medium line-clamp-1">
          {category.plural_name || category.singular_name || "خدمات مهنية متخصصة"}
        </p>
      </div>

      {/* شارة عدد الصنايعية */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        {hasCraftsmen ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
            <IconUsers className="h-3.5 w-3.5" />
            <span>{toArabicDigits(category.count)} صنايعي</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/10 px-2.5 py-1 text-xs font-medium text-muted">
            متاح للطلب
          </span>
        )}

        <span className="text-xs font-semibold text-muted/80 group-hover:text-accent transition-colors">
          تصفح الفنيين
        </span>
      </div>
    </Link>
  );
}
