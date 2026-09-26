import Link from "next/link";
import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconArrow } from "@/components/shared/icons";
import { categoryColor } from "@/lib/utils/categoryColor";
import { categoryHref } from "@/lib/utils/url";
import { toArabicDigits } from "@/lib/utils/format";

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  const color = categoryColor(category.slug);

  return (
    <Link
      href={categoryHref(category.slug)}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-2xs backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-md active:scale-[0.98] text-center sm:flex-row sm:items-center sm:gap-3.5 sm:p-4 sm:text-start"
    >
      {/* الأيقونة */}
      <div
        className="rounded-xl p-2.5 transition-all duration-300 group-hover:scale-110 shadow-2xs shrink-0"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
          color,
        }}
      >
        <CategoryIcon name={category.icon} className="h-6 w-6 sm:h-5 sm:w-5" />
      </div>

      {/* النص — على الموبايل في المنتصف، على الديسكتوب يأخذ المساحة */}
      <div className="min-w-0 flex-1 w-full">
        <h3 className="font-heading text-xs sm:text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-2 sm:truncate sm:text-base">
          {category.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted font-medium">
          {toArabicDigits(category.count)} صنايعي
        </p>
      </div>

      {/* سهم — مخفي على الموبايل، ظاهر على الديسكتوب */}
      <div className="hidden sm:flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-accent/5 transition-colors group-hover:bg-accent/15">
        <IconArrow className="h-3.5 w-3.5 text-muted transition-all duration-300 group-hover:text-accent group-hover:-translate-x-0.5" />
      </div>
    </Link>
  );
}
