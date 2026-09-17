import { IconPin, IconTags, IconUsers } from "@/components/shared/icons";
import type { OverviewMetrics } from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";

/**
 * ملخص البيانات المرجعية — شريط مختصر في أسفل تبويب الملخص:
 * عدد الصنايعية المنشورين والتصنيفات والمناطق النشطة.
 */
export function SecondaryStats({ metrics }: { metrics: OverviewMetrics }) {
  return (
    <section className="flex flex-wrap justify-center gap-3 rounded-xl border border-border bg-card p-3 text-sm text-muted sm:p-4">
      <span className="inline-flex items-center gap-1.5">
        <IconUsers className="h-4 w-4 text-accent" />
        <span className="font-bold text-foreground">
          {toArabicDigits(metrics.publishedCraftsmen)}
        </span>
        <span> من {toArabicDigits(metrics.totalCraftsmen)} صنايعي منشور</span>
      </span>
      <span className="text-border" aria-hidden>
        ·
      </span>
      <span className="inline-flex items-center gap-1.5">
        <IconTags className="h-4 w-4 text-accent" />
        <span className="font-bold text-foreground">
          {toArabicDigits(metrics.activeCategories)}
        </span>
        <span> من {toArabicDigits(metrics.totalCategories)} تخصص نشط</span>
      </span>
      <span className="text-border" aria-hidden>
        ·
      </span>
      <span className="inline-flex items-center gap-1.5">
        <IconPin className="h-4 w-4 text-accent" />
        <span className="font-bold text-foreground">
          {toArabicDigits(metrics.activeAreas)}
        </span>
        <span> من {toArabicDigits(metrics.totalAreas)} منطقة نشطة</span>
      </span>
    </section>
  );
}
