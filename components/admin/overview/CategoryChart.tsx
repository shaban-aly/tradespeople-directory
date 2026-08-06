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
  return (
    <AdminSection
      title="صنايعية لكل تخصص"
      description="عدد الصنايعية المسجلين في كل تصنيف نشط"
      icon={<IconChart className="h-6 w-6" />}
    >
      {items.length === 0 ? (
        <EmptyState title="لا توجد تصنيفات نشطة حالياً" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.name} className="grid gap-1">
              <div className="flex items-center justify-between text-base">
                <span className="font-bold text-foreground">{item.name}</span>
                <span className="text-muted">{toArabicDigits(item.count)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}
