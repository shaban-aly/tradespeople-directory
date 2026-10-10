import { IconPin, IconTags, IconUsers } from "@/components/shared/icons";
import type { OverviewMetrics } from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";

/**
 * ملخص البيانات المرجعية — شريط أنيق في أسفل تبويب الملخص:
 * عدد الصنايعية المنشورين والتصنيفات والمناطق النشطة.
 */
export function SecondaryStats({ metrics }: { metrics: OverviewMetrics }) {
  return (
    <section aria-label="بيانات الدليل المرجعية" className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 rounded-2xl border border-border bg-card/60 p-3.5 text-xs sm:text-sm text-muted shadow-xs backdrop-blur-xs">
      <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-1.5">
        <IconUsers className="h-4 w-4 text-accent" />
        <span>
          <strong className="font-heading font-black text-foreground">
            {toArabicDigits(metrics.publishedCraftsmen)}
          </strong>{" "}
          من {toArabicDigits(metrics.totalCraftsmen)} فني منشور
        </span>
      </div>

      <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-1.5">
        <IconTags className="h-4 w-4 text-accent" />
        <span>
          <strong className="font-heading font-black text-foreground">
            {toArabicDigits(metrics.activeCategories)}
          </strong>{" "}
          من {toArabicDigits(metrics.totalCategories)} تخصص نشط
        </span>
      </div>

      <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-1.5">
        <IconPin className="h-4 w-4 text-accent" />
        <span>
          <strong className="font-heading font-black text-foreground">
            {toArabicDigits(metrics.activeAreas)}
          </strong>{" "}
          من {toArabicDigits(metrics.totalAreas)} منطقة نشطة
        </span>
      </div>
    </section>
  );
}
