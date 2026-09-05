import Link from "next/link";
import { CategoryIcon } from "@/components/shared/ui/CategoryIcon";
import { categoryColor } from "@/lib/utils/categoryColor";
import { categoryHref } from "@/lib/utils/url";

// أزرار سريعة للتخصصات الأكثر طلباً — نقرة واحدة تودي للتخصص مباشرة
// بدل الكتابة في البحث أو النزول لأسفل الصفحة.
const QUICK_CATEGORIES = [
  { slug: "plumbing", name: "سباكة" },
  { slug: "electrical", name: "كهرباء" },
  { slug: "hvac", name: "تكييف" },
  { slug: "carpentry", name: "نجارة" },
  { slug: "painting", name: "نقاشة" },
  { slug: "aluminum", name: "ألوميتال" },
];

export function QuickIntentChips() {
  return (
    <div
      className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2"
      aria-label="تخصصات سريعة"
    >
      {QUICK_CATEGORIES.map((category) => {
        const color = categoryColor(category.slug);
        return (
          <Link
            key={category.slug}
            href={categoryHref(category.slug)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 text-sm font-bold text-foreground shadow-card backdrop-blur transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
          >
            <span style={{ color }}>
              <CategoryIcon name={category.slug} className="h-4 w-4" />
            </span>
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
