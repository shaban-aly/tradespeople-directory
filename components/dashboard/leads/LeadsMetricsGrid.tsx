import { toArabicDigits } from "@/lib/utils/format";
import { IconBell, IconCheck, IconClock } from "@/components/shared/icons";

interface LeadsMetricsGridProps {
  openCount: number;
  activeClaimedCount: number;
  closedClaimedCount: number;
}

/**
 * شبكة المؤشرات السريعة لحالة العروض والطلبات (Leads Metrics Grid):
 * - عدادات واضحة وسريعة القراءة للمؤشرات التشغيلية الثلاثة.
 * - خطوط معتمدة متوافقة مع سلم DESIGN.md وتصميم موحد مع كروت لوحة التحكم.
 */
export function LeadsMetricsGrid({
  openCount,
  activeClaimedCount,
  closedClaimedCount,
}: LeadsMetricsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-center shadow-xs transition-colors hover:border-accent/40">
        <span className="flex h-8 w-8 mx-auto items-center justify-center rounded-xl bg-accent/10 text-accent" aria-hidden="true">
          <IconBell className="h-4 w-4" />
        </span>
        <p className="mt-2 font-heading text-xl sm:text-2xl font-black text-foreground leading-tight">
          {toArabicDigits(openCount)}
        </p>
        <p className="mt-1 text-xs text-muted font-bold">عروض متاحة للرد</p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-center shadow-xs transition-colors hover:border-action/40">
        <span className="flex h-8 w-8 mx-auto items-center justify-center rounded-xl bg-action/15 text-action" aria-hidden="true">
          <IconClock className="h-4 w-4" />
        </span>
        <p className="mt-2 font-heading text-xl sm:text-2xl font-black text-foreground leading-tight">
          {toArabicDigits(activeClaimedCount)}
        </p>
        <p className="mt-1 text-xs text-muted font-bold">طلبات قيد التواصل</p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-center shadow-xs transition-colors hover:border-border">
        <span className="flex h-8 w-8 mx-auto items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
          <IconCheck className="h-4 w-4" />
        </span>
        <p className="mt-2 font-heading text-xl sm:text-2xl font-black text-foreground leading-tight">
          {toArabicDigits(closedClaimedCount)}
        </p>
        <p className="mt-1 text-xs text-muted font-bold">طلبات سابقة</p>
      </div>
    </div>
  );
}
