import { AdminSection } from "@/components/admin/AdminSection";
import { EmptyState } from "@/components/admin/EmptyState";
import { IconTrendingUp } from "@/components/shared/icons";
import type { MostContactedItem } from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";

export function MostContactedList({
  items,
}: {
  items: MostContactedItem[];
}) {
  return (
    <AdminSection
      title="الأكثر تواصلاً"
      description="أعلى صنايعية من حيث ضغطات الاتصال والواتساب"
      icon={<IconTrendingUp className="h-6 w-6" />}
    >
      {items.length === 0 ? (
        <EmptyState title="لا توجد ضغطات مسجلة بعد" />
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <div
              key={item.craftsman.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 sm:p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 font-heading text-base font-extrabold text-accent">
                  {toArabicDigits(index + 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-foreground">
                    {item.craftsman.name}
                  </p>
                  <p className="truncate text-base text-muted">
                    {item.craftsman.category?.name} · {item.craftsman.area?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-base text-muted">
                <span>
                  {toArabicDigits(item.craftsman.stats?.calls ?? 0)} اتصال
                </span>
                <span className="text-border">·</span>
                <span>
                  {toArabicDigits(item.craftsman.stats?.whatsapp ?? 0)} واتساب
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}
