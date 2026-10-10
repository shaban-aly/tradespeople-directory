import { toArabicDigits } from "@/lib/utils/format";
import { IconBell, IconCheck, IconClock } from "@/components/shared/icons";
import type { LeadsFilter } from "@/hooks/leads/useLeadsBoardFilter";

interface LeadsMetricsGridProps {
  openCount: number;
  activeClaimedCount: number;
  closedClaimedCount: number;
  activeFilter?: LeadsFilter;
  onFilterChange?: (filter: LeadsFilter) => void;
}

/**
 * شبكة المؤشرات السريعة وفلاتر العروض والطلبات (Leads Metrics Grid & Filter Tabs):
 * - بطاقات إحصائية تفاعلية تعمل كأزرار تبديل سريعة لعرض القسم المطلوب.
 * - إبراز فوري للبطاقة النشطة لتسهيل التصفح والوصول لطلبات التواصل مباشرة.
 */
export function LeadsMetricsGrid({
  openCount,
  activeClaimedCount,
  closedClaimedCount,
  activeFilter,
  onFilterChange,
}: LeadsMetricsGridProps) {
  const isInteractive = Boolean(onFilterChange);

  return (
    <div
      role={isInteractive ? "tablist" : undefined}
      aria-label="فلاتر تصنيف طلبات العمل"
      className="grid grid-cols-3 gap-2.5 sm:gap-4"
    >
      {/* 1. طلبات قيد التواصل (أهم مؤشر للفني في العمل الجاري) */}
      <button
        type="button"
        role={isInteractive ? "tab" : undefined}
        aria-selected={activeFilter === "activeClaimed"}
        onClick={() => onFilterChange?.(activeFilter === "activeClaimed" ? "all" : "activeClaimed")}
        disabled={!isInteractive}
        className={`group relative rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-action ${
          activeFilter === "activeClaimed"
            ? "border-2 border-action bg-action/10 ring-2 ring-action/20 shadow-xs"
            : "border border-border/80 bg-card shadow-xs hover:border-action/40 hover:bg-muted/10"
        }`}
      >
        <span
          className={`flex h-8 w-8 mx-auto items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
            activeFilter === "activeClaimed"
              ? "bg-action text-white"
              : "bg-action/15 text-action"
          }`}
          aria-hidden="true"
        >
          <IconClock className="h-4 w-4" />
        </span>
        <p className="mt-2 font-heading text-xl sm:text-2xl font-black text-foreground leading-tight">
          {toArabicDigits(activeClaimedCount)}
        </p>
        <p className={`mt-1 text-xs font-bold transition-colors ${
          activeFilter === "activeClaimed" ? "text-action" : "text-muted"
        }`}>
          طلبات قيد التواصل
        </p>
        {activeFilter === "activeClaimed" && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-action" />
        )}
      </button>

      {/* 2. عروض متاحة للرد */}
      <button
        type="button"
        role={isInteractive ? "tab" : undefined}
        aria-selected={activeFilter === "open"}
        onClick={() => onFilterChange?.(activeFilter === "open" ? "all" : "open")}
        disabled={!isInteractive}
        className={`group relative rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
          activeFilter === "open"
            ? "border-2 border-accent bg-accent/10 ring-2 ring-accent/20 shadow-xs"
            : "border border-border/80 bg-card shadow-xs hover:border-accent/40 hover:bg-muted/10"
        }`}
      >
        <span
          className={`flex h-8 w-8 mx-auto items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
            activeFilter === "open"
              ? "bg-accent text-on-accent"
              : "bg-accent/10 text-accent"
          }`}
          aria-hidden="true"
        >
          <IconBell className="h-4 w-4" />
        </span>
        <p className="mt-2 font-heading text-xl sm:text-2xl font-black text-foreground leading-tight">
          {toArabicDigits(openCount)}
        </p>
        <p className={`mt-1 text-xs font-bold transition-colors ${
          activeFilter === "open" ? "text-accent" : "text-muted"
        }`}>
          عروض متاحة للرد
        </p>
        {activeFilter === "open" && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-accent" />
        )}
      </button>

      {/* 3. طلبات سابقة */}
      <button
        type="button"
        role={isInteractive ? "tab" : undefined}
        aria-selected={activeFilter === "closedClaimed"}
        onClick={() => onFilterChange?.(activeFilter === "closedClaimed" ? "all" : "closedClaimed")}
        disabled={!isInteractive}
        className={`group relative rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-muted ${
          activeFilter === "closedClaimed"
            ? "border-2 border-muted bg-muted/15 ring-2 ring-muted/20 shadow-xs"
            : "border border-border/80 bg-card shadow-xs hover:border-border hover:bg-muted/10"
        }`}
      >
        <span
          className={`flex h-8 w-8 mx-auto items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
            activeFilter === "closedClaimed"
              ? "bg-foreground text-background"
              : "bg-muted/15 text-muted"
          }`}
          aria-hidden="true"
        >
          <IconCheck className="h-4 w-4" />
        </span>
        <p className="mt-2 font-heading text-xl sm:text-2xl font-black text-foreground leading-tight">
          {toArabicDigits(closedClaimedCount)}
        </p>
        <p className={`mt-1 text-xs font-bold transition-colors ${
          activeFilter === "closedClaimed" ? "text-foreground font-black" : "text-muted"
        }`}>
          طلبات سابقة
        </p>
        {activeFilter === "closedClaimed" && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-muted" />
        )}
      </button>
    </div>
  );
}
