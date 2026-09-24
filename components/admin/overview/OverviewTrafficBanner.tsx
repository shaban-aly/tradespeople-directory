import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { Eye, Globe } from "lucide-react";
import { toArabicDigits } from "@/lib/utils/format";

interface OverviewTrafficBannerProps {
  ga4?: {
    sessionsToday: number;
    activeUsersToday: number;
    pageViewsToday: number;
    newUsersToday: number;
  } | null;
  ga4Loading?: boolean;
  viewsToday: number;
  callsToday: number;
  whatsappToday: number;
}

export function OverviewTrafficBanner({
  ga4,
  ga4Loading = false,
  viewsToday,
  callsToday,
  whatsappToday,
}: OverviewTrafficBannerProps) {
  const formatNum = (val: number | undefined, loading = false) => {
    if (loading) return "—";
    return toArabicDigits(val ?? 0);
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            نشاط وزيارات اليوم
          </h2>
        </div>
        <span className="text-xs text-muted">
          بيانات حية مباشرة من Google Analytics 4 وقاعدة البيانات
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* 1. زيارات الموقع (Sessions) */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-accent/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">زيارات الموقع (جلسات)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-black text-foreground sm:text-3xl">
              {formatNum(ga4?.sessionsToday, ga4Loading)}
            </div>
            <div className="mt-1 text-[11px] text-muted sm:text-xs">
              {ga4Loading ? "جاري التحميل..." : `${formatNum(ga4?.activeUsersToday)} زائر نشط`}
            </div>
          </div>
        </div>

        {/* 2. مشاهدات الصنايعية */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-accent/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">مشاهدات الصنايعية</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-black text-foreground sm:text-3xl">
              {formatNum(viewsToday)}
            </div>
            <div className="mt-1 text-[11px] text-muted sm:text-xs">
              زيارات لصفحات الصنايعية
            </div>
          </div>
        </div>

        {/* 3. محادثات واتساب */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-accent/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">تواصل واتساب</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconWhatsApp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-black text-emerald-600 dark:text-emerald-400 sm:text-3xl">
              {formatNum(whatsappToday)}
            </div>
            <div className="mt-1 text-[11px] text-muted sm:text-xs">
              نقرة لمحادثة واتساب
            </div>
          </div>
        </div>

        {/* 4. اتصالات هاتفية */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-background/50 p-4 transition-all hover:border-accent/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">اتصالات هاتفية</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <IconPhone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-heading text-2xl font-black text-accent sm:text-3xl">
              {formatNum(callsToday)}
            </div>
            <div className="mt-1 text-[11px] text-muted sm:text-xs">
              نقرة اتصال مباشر
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
