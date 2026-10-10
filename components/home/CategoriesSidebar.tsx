import Link from "next/link";
import type { CategoryWithCount } from "@/lib/data/craftsmen";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { IconArrow, IconGrid } from "@/components/shared/icons";
import { categoryColor } from "@/lib/utils/categoryColor";
import { categoryHref } from "@/lib/utils/url";
import { toArabicDigits } from "@/lib/utils/format";
import { ButtonLink } from "@/components/shared/ui/Button";

export function CategoriesSidebar({
  categories,
  totalCategories,
  className = "",
}: {
  categories: CategoryWithCount[];
  totalCategories?: number;
  className?: string;
}) {
  return (
    <aside
      id="categories-sidebar"
      aria-label="قائمة التخصصات"
      className={`w-72 xl:w-80 shrink-0 sticky top-24 self-start rounded-2xl border border-border bg-card p-4 shadow-card transition-all ${className}`}
    >
      {/* رأس السايدبار */}
      <div className="flex items-center justify-between border-b border-border pb-3.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <IconGrid className="h-4 w-4" />
          </div>
          <h2 className="font-heading text-base font-bold text-foreground">
            التخصصات المتاحة
          </h2>
        </div>
        {totalCategories !== undefined && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
            {toArabicDigits(totalCategories)} مهنة
          </span>
        )}
      </div>

      {/* قائمة التخصصات العمودية مع سكرول داخلي نحيف عند الحاجة */}
      <nav
        aria-label="روابط المهن"
        className="max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar -me-1 pe-1 flex flex-col gap-1"
      >
        {categories.map((category) => {
          const color = categoryColor(category.slug);

          return (
            <Link
              key={category.slug}
              href={categoryHref(category.slug)}
              className="group flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-start transition-all hover:bg-accent/8 hover:-translate-x-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.99]"
            >
              {/* الأيقونة والاسم */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-2xs transition-transform duration-200 group-hover:scale-110"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                    color,
                  }}
                >
                  <CategoryIcon name={category.icon} className="h-4 w-4" />
                </div>
                <span className="truncate font-heading text-sm font-bold text-foreground transition-colors group-hover:text-accent">
                  {category.name}
                </span>
              </div>

              {/* العداد والسهم */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-medium text-muted">
                  {toArabicDigits(category.count)}
                </span>
                <IconArrow className="h-3 w-3 text-muted/60 transition-all duration-200 group-hover:text-accent group-hover:-translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* رابط استعراض كل التخصصات */}
      <div className="mt-3 pt-3 border-t border-border">
        <ButtonLink
          href="/categories"
          variant="ghost"
          size="sm"
          className="group/btn w-full justify-center text-xs font-bold"
        >
          <span>عرض جميع التخصصات</span>
          <IconArrow className="h-3.5 w-3.5 text-muted transition-transform duration-200 group-hover/btn:-translate-x-1 group-hover/btn:text-accent" />
        </ButtonLink>
      </div>
    </aside>
  );
}
