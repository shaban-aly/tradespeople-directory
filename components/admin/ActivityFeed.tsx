"use client";

import { useState } from "react";
import Link from "next/link";
import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { fetchAdminActivityFeed, type ActivityFeedItem } from "@/lib/db/admin";
import { formatRelativeTimeArabic } from "@/lib/utils/format";

export type Timeframe = "today" | "week" | "month";

interface ActivityFeedProps {
  timeframe?: Timeframe;
  items?: ActivityFeedItem[];
}

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "آخر 7 أيام" },
  { value: "month", label: "آخر شهر" },
];

export function ActivityFeed({
  timeframe = "today",
  items = [],
}: ActivityFeedProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>(timeframe);
  const [feedList, setFeedList] = useState<ActivityFeedItem[]>(items);
  const [isLoading, setIsLoading] = useState(false);

  const handleTimeframeChange = async (newTimeframe: Timeframe) => {
    if (newTimeframe === activeTimeframe || isLoading) return;
    setActiveTimeframe(newTimeframe);
    setIsLoading(true);
    try {
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/admin?timeframe=${newTimeframe}`);
      }
      const newItems = await fetchAdminActivityFeed(undefined, newTimeframe);
      setFeedList(newItems);
    } catch (err) {
      console.error("فشل جلب سجل التفاعلات:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCount = feedList.length;
  const whatsappCount = feedList.filter((i) => i.contactMethod === "whatsapp").length;
  const phoneCount = feedList.filter((i) => i.contactMethod === "phone").length;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
      {/* رأس القسم مع أزرار الفلترة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${
                isLoading ? "bg-amber-500 animate-spin" : "bg-emerald-500 animate-pulse"
              }`}
            />
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              سجل التفاعلات اللحظي (Activity Feed)
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            متابعة حية لاتصالات ورسائل الواتساب مع الصنايعية (أرشيف مؤقت لآخر 30 يوماً).
          </p>
        </div>

        {/* أزرار الفلترة اللحظية بلا إعادة تحميل الصفحة */}
        <div className="flex items-center gap-1 rounded-2xl border border-border bg-background p-1 self-start sm:self-auto">
          {TIMEFRAME_OPTIONS.map((opt) => {
            const isActive = activeTimeframe === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => void handleTimeframeChange(opt.value)}
                disabled={isLoading}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:text-sm cursor-pointer disabled:opacity-60 ${
                  isActive
                    ? "bg-accent text-accent-contrast shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-card"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ملخص أرقام السجل في هذه الفترة */}
      <div className="grid grid-cols-3 gap-2 py-4 border-b border-border">
        <div className="rounded-2xl border border-border bg-background/50 p-2.5 text-center">
          <div className="text-xs text-muted">إجمالي التفاعلات</div>
          <div className="mt-1 text-base font-extrabold text-foreground sm:text-lg">
            {totalCount}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background/50 p-2.5 text-center">
          <div className="text-xs text-muted">عبر واتساب</div>
          <div className="mt-1 text-base font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-lg">
            {whatsappCount}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background/50 p-2.5 text-center">
          <div className="text-xs text-muted">اتصال هاتفي</div>
          <div className="mt-1 text-base font-extrabold text-accent sm:text-lg">
            {phoneCount}
          </div>
        </div>
      </div>

      {/* قائمة التفاعلات */}
      {feedList.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted">
            <IconPhone className="h-6 w-6 opacity-40" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground sm:text-base">
            لا توجد تفاعلات مسجلة في هذه الفترة
          </h3>
          <p className="mt-1 text-xs text-muted">
            ستظهر هنا العمليات فور قيام الزوار بالنقر على الاتصال أو الواتساب لأي صانع.
          </p>
        </div>
      ) : (
        <div
          className={`mt-4 divide-y divide-border/60 transition-opacity duration-200 ${
            isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
          }`}
        >
          {feedList.map((item) => {
            const isWhatsapp = item.contactMethod === "whatsapp";
            const isAuthenticated = item.userStatus === "authenticated";

            return (
              <div
                key={item.logId}
                className="flex items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-1 transition-colors hover:bg-background/40 rounded-xl px-2"
              >
                {/* أيقونة وسيلة التواصل */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      isWhatsapp
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {isWhatsapp ? (
                      <IconWhatsApp className="h-5 w-5" />
                    ) : (
                      <IconPhone className="h-5 w-5" />
                    )}
                  </div>

                  {/* تفاصيل الحدث */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-foreground">
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          isAuthenticated
                            ? "bg-accent/15 text-accent font-semibold"
                            : "bg-muted/15 text-muted"
                        }`}
                      >
                        {isAuthenticated
                          ? item.userDisplayName
                            ? `المستخدم: ${item.userDisplayName}`
                            : "مستخدم مسجل"
                          : "زائر مجهول"}
                      </span>
                      <span>تواصل مع</span>
                      <Link
                        href={`/craftsman/${encodeURIComponent(item.craftsmanSlug)}`}
                        className="font-bold text-foreground hover:text-accent hover:underline truncate max-w-[140px] sm:max-w-[220px]"
                        title={item.craftsmanName}
                      >
                        {item.craftsmanName}
                      </Link>
                      <span>عبر {isWhatsapp ? "واتساب" : "الاتصال"}</span>
                    </div>

                    <div className="mt-0.5 text-[11px] text-muted sm:text-xs">
                      {new Date(item.createdAt).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {/* الوقت النسبي */}
                <div className="shrink-0 text-left text-xs font-medium text-muted">
                  {formatRelativeTimeArabic(item.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
