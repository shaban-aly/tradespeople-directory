import {
  IconEye,
  IconPhone,
  IconUsers,
  IconWhatsApp,
} from "@/components/shared/icons";
import { Globe } from "lucide-react";
import { toArabicDigits } from "@/lib/utils/format";

interface OverviewTrafficBannerProps {
  ga4?: {
    sessionsToday: number;
    activeUsersToday: number;
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
    <section aria-labelledby="traffic-banner-title" className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-card">
      {/* رأس القسم: نبض النشاط الحي */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5 sm:pb-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10 text-accent">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 id="traffic-banner-title" className="font-heading text-sm font-bold text-foreground sm:text-lg">
              نشاط وتفاعل اليوم
            </h2>
            <p className="hidden sm:block text-xs text-muted">
              بيانات موثوقة ومباشرة من Google Analytics 4 وسجلات التفاعل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-action/30 bg-action/10 px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-bold text-action shadow-xs">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-action animate-pulse" />
            مباشر
          </span>
        </div>
      </div>

      {/* بطاقات المؤشرات الأربعة — شبكة 2x2 مدمجة على الموبايل و 4x1 على الشاشات الكبيرة */}
      <div className="mt-3 sm:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* 1. زيارات الموقع (Sessions) */}
        <div className="group flex flex-col justify-between rounded-lg sm:rounded-xl border border-border bg-background/50 p-2.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-background">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted truncate">جلسات الزوار</span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg bg-accent/10 text-accent">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <div className="font-heading text-xl font-black text-foreground sm:text-3xl">
              {formatNum(ga4?.sessionsToday, ga4Loading)}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <IconUsers className="h-3 w-3 text-accent" />
              <span className="truncate">
                {ga4Loading ? "..." : `${formatNum(ga4?.activeUsersToday)} نشط`}
              </span>
            </div>
          </div>
        </div>

        {/* 2. مشاهدات الصنايعية */}
        <div className="group flex flex-col justify-between rounded-lg sm:rounded-xl border border-border bg-background/50 p-2.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-background">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted truncate">مشاهدات البروفايل</span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg bg-accent/10 text-accent">
              <IconEye className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <div className="font-heading text-xl font-black text-foreground sm:text-3xl">
              {formatNum(viewsToday)}
            </div>
            <div className="mt-0.5 text-xs text-muted truncate">
              زيارات الفنيين
            </div>
          </div>
        </div>

        {/* 3. اتصالات هاتفية */}
        <div className="group flex flex-col justify-between rounded-lg sm:rounded-xl border border-border bg-background/50 p-2.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-background">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted truncate">اتصالات هاتفية</span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg bg-accent/10 text-accent">
              <IconPhone className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <div className="font-heading text-xl font-black text-accent sm:text-3xl">
              {formatNum(callsToday)}
            </div>
            <div className="mt-0.5 text-xs text-muted truncate">
              نقرة اتصال
            </div>
          </div>
        </div>

        {/* 4. محادثات واتساب */}
        <div className="group flex flex-col justify-between rounded-lg sm:rounded-xl border border-border bg-background/50 p-2.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-action/40 hover:bg-background">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted truncate">تواصل واتساب</span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg bg-action/15 text-action">
              <IconWhatsApp className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <div className="font-heading text-xl font-black text-action sm:text-3xl">
              {formatNum(whatsappToday)}
            </div>
            <div className="mt-0.5 text-xs text-muted truncate">
              نقرة واتساب
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
