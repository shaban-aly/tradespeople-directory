"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconPhone, IconWhatsApp } from "@/components/shared/icons";
import { fetchAdminActivityFeed, type ActivityFeedItem } from "@/lib/db/admin";
import { formatRelativeTimeArabic, toArabicDigits } from "@/lib/utils/format";

export type Timeframe = "today" | "week" | "month";

interface ActivityFeedProps {
  timeframe?: Timeframe;
  items?: ActivityFeedItem[];
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "آخر 7 أيام" },
  { value: "month", label: "آخر شهر" },
];

export function ActivityFeed({
  timeframe = "today",
  items = [],
  onTimeframeChange,
}: ActivityFeedProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>(timeframe);
  const [feedList, setFeedList] = useState<ActivityFeedItem[]>(items);
  const [isLoading, setIsLoading] = useState(false);

  const [lastTimeframe, setLastTimeframe] = useState(timeframe);
  if (timeframe !== lastTimeframe) {
    setLastTimeframe(timeframe);
    setActiveTimeframe(timeframe);
  }

  const [lastItems, setLastItems] = useState(items);
  if (items !== lastItems) {
    setLastItems(items);
    setFeedList(items);
  }

  const handleTimeframeChange = async (newTimeframe: Timeframe) => {
    if (newTimeframe === activeTimeframe || isLoading) return;
    setActiveTimeframe(newTimeframe);
    setIsLoading(true);
    try {
      if (onTimeframeChange) {
        onTimeframeChange(newTimeframe);
      } else if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        sp.set("timeframe", newTimeframe);
        window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
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
    <section aria-labelledby="activity-feed-title" className="rounded-xl sm:rounded-2xl border border-border bg-card p-3.5 sm:p-6 shadow-card">
      {/* رأس القسم مع أزرار الفلترة */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${
                isLoading ? "bg-warning animate-spin" : "bg-action animate-pulse"
              }`}
            />
            <h2 id="activity-feed-title" className="font-heading text-sm font-bold text-foreground sm:text-lg">
              سجل التفاعلات اللحظي
            </h2>
          </div>
          <p className="hidden sm:block mt-1 text-xs text-muted">
            متابعة حية وفورية لاتصالات ورسائل الواتساب مع الصنايعية (أرشيف مؤقت لآخر 30 يوماً).
          </p>
        </div>

        {/* أزرار الفلترة اللحظية بلا إعادة تحميل الصفحة */}
        <div className="inline-flex items-center gap-1 rounded-lg sm:rounded-xl border border-border bg-background p-0.5 sm:p-1 self-start sm:self-auto shadow-xs">
          {TIMEFRAME_OPTIONS.map((opt) => {
            const isActive = activeTimeframe === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => void handleTimeframeChange(opt.value)}
                disabled={isLoading}
                className={`rounded-md sm:rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive
                    ? "bg-accent text-on-accent shadow-xs"
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
      <div className="grid grid-cols-3 gap-2 py-2.5 sm:py-4 border-b border-border">
        <div className="rounded-lg sm:rounded-xl border border-border bg-background/50 p-1.5 sm:p-2.5 text-center transition-colors hover:bg-background">
          <div className="text-xs text-muted truncate">إجمالي التفاعلات</div>
          <div className="mt-0.5 font-heading text-base font-black text-foreground sm:text-xl">
            {toArabicDigits(totalCount)}
          </div>
        </div>
        <div className="rounded-lg sm:rounded-xl border border-border bg-background/50 p-1.5 sm:p-2.5 text-center transition-colors hover:bg-background">
          <div className="text-xs text-muted truncate">عبر واتساب</div>
          <div className="mt-0.5 font-heading text-base font-black text-action sm:text-xl">
            {toArabicDigits(whatsappCount)}
          </div>
        </div>
        <div className="rounded-lg sm:rounded-xl border border-border bg-background/50 p-1.5 sm:p-2.5 text-center transition-colors hover:bg-background">
          <div className="text-xs text-muted truncate">اتصال هاتفي</div>
          <div className="mt-0.5 font-heading text-base font-black text-accent sm:text-xl">
            {toArabicDigits(phoneCount)}
          </div>
        </div>
      </div>

      {/* قائمة التفاعلات */}
      {feedList.length === 0 ? (
        <div className="py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-border bg-background text-muted">
            <IconPhone className="h-6 w-6 opacity-40" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground sm:text-base">
            لا توجد تفاعلات مسجلة في هذه الفترة
          </h3>
          <p className="mt-1 text-xs text-muted">
            ستظهر هنا العمليات فور قيام الزوار بالنقر على الاتصال أو الواتساب لأي صنايعي.
          </p>
        </div>
      ) : (
        <div
          className={`mt-3 divide-y divide-border/60 transition-opacity duration-200 ${
            isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
          }`}
        >
          {feedList.map((item) => {
            const isWhatsapp = item.contactMethod === "whatsapp";
            const isAuthenticated = item.userStatus === "authenticated";

            return (
              <div
                key={item.logId}
                className="group flex items-center justify-between gap-2.5 py-2 sm:py-3 first:pt-1 last:pb-1 transition-colors hover:bg-background/60 rounded-xl px-1.5 sm:px-2"
              >
                {/* أيقونة وسيلة التواصل */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform group-hover:scale-105 ${
                      isWhatsapp
                        ? "bg-action/15 text-action"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {isWhatsapp ? (
                      <IconWhatsApp className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <IconPhone className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>

                  {/* تفاصيل الحدث */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-foreground">
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-medium ${
                          isAuthenticated
                            ? "bg-accent/15 text-accent font-semibold"
                            : "bg-muted/15 text-muted"
                        }`}
                      >
                        {isAuthenticated
                          ? item.userDisplayName
                            ? `👤 ${item.userDisplayName}`
                            : "مستخدم مسجل"
                          : "زائر"}
                      </span>
                      <span className="text-muted">تواصل مع</span>
                      <Link
                        href={`/craftsman/${encodeURIComponent(item.craftsmanSlug)}`}
                        className="font-bold text-foreground hover:text-accent hover:underline truncate max-w-[140px] sm:max-w-[220px]"
                        title={item.craftsmanName}
                      >
                        {item.craftsmanName}
                      </Link>
                      <span className="text-muted">عبر {isWhatsapp ? "واتساب" : "الاتصال"}</span>
                    </div>

                    <div className="mt-0.5 text-xs text-muted">
                      {new Date(item.createdAt).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {/* الوقت النسبي */}
                <div className="shrink-0 text-left text-xs font-bold text-muted">
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
