import { AdminSection } from "@/components/admin/AdminSection";
import { EmptyState } from "@/components/admin/EmptyState";
import { IconChart } from "@/components/shared/icons";
import type { CategoryChartItem } from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";

export function CategoryChart({
  items,
  maxCount,
}: {
  items: CategoryChartItem[];
  maxCount: number;
}) {
  const totalCount = items.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <AdminSection
      title="توزيع الصنايعية حسب التخصص"
      description="عدد ونسبة الصنايعية المسجلين في كل تصنيف نشط"
      icon={<IconChart className="h-6 w-6" />}
    >
      {items.length === 0 ? (
        <EmptyState title="لا توجد تصنيفات نشطة حالياً" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const pctOfMax = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const pctOfTotal =
              totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;

            return (
              <div
                key={item.name}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-accent/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="font-bold text-foreground text-sm sm:text-base group-hover:text-accent transition-colors line-clamp-1"
                    title={item.name}
                  >
                    {item.name}
                  </span>
                  <span className="shrink-0 rounded-lg bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                    {toArabicDigits(item.count)}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                    <span>من الإجمالي</span>
                    <span className="font-semibold">{toArabicDigits(pctOfTotal)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${pctOfMax}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminSection>
  );
}
