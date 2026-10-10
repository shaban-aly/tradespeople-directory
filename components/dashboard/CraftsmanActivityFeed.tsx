"use client";

import { useMemo, useState } from "react";
import { IconPhone, IconUser, IconWhatsApp } from "@/components/shared/icons";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { toArabicDigits, formatRelativeTimeArabic } from "@/lib/utils/format";
import type { CraftsmanActivityItem } from "@/lib/db/craftsman-dashboard";

interface CraftsmanActivityFeedProps {
  items?: CraftsmanActivityItem[];
}

type FeedFilter = "all" | "whatsapp" | "phone" | "registered";
type TimeframeFilter = "7d" | "30d" | "all";

const TIMEFRAMES: { id: TimeframeFilter; label: string }[] = [
  { id: "7d", label: "آخر ٧ أيام" },
  { id: "30d", label: "آخر ٣٠ يوماً" },
  { id: "all", label: "الكل" },
];

export function CraftsmanActivityFeed({
  items = [],
}: CraftsmanActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("30d");

  // 1. تصفية العناصر بحسب الفترة الزمنية المختارة
  const timeframeItems = useMemo(() => {
    if (timeframe === "all") return items;
    const now = Date.now();
    const daysLimit = timeframe === "7d" ? 7 : 30;
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000;
    return items.filter((item) => new Date(item.createdAt).getTime() >= cutoff);
  }, [items, timeframe]);

  // 2. حساب الأعداد للفترة الزمنية الحالية
  const whatsappCount = timeframeItems.filter((i) => i.contactMethod === "whatsapp").length;
  const phoneCount = timeframeItems.filter((i) => i.contactMethod === "phone").length;
  const registeredCount = timeframeItems.filter((i) => i.userStatus === "authenticated").length;

  // 3. تطبيق فلتر طريقة التواصل أو نوع العميل
  const filteredItems = useMemo(() => {
    if (activeFilter === "whatsapp") return timeframeItems.filter((i) => i.contactMethod === "whatsapp");
    if (activeFilter === "phone") return timeframeItems.filter((i) => i.contactMethod === "phone");
    if (activeFilter === "registered") return timeframeItems.filter((i) => i.userStatus === "authenticated");
    return timeframeItems;
  }, [timeframeItems, activeFilter]);

  const hasItems = items.length > 0;

  const filterTabs: { id: FeedFilter; label: string; count: number }[] = [
    { id: "all", label: "الكل", count: timeframeItems.length },
    { id: "whatsapp", label: "واتساب", count: whatsappCount },
    { id: "phone", label: "مكالمات", count: phoneCount },
    { id: "registered", label: "عملاء مسجلون", count: registeredCount },
  ];

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-card">
      {/* Header مع التصفية الزمنية المدمجة */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base sm:text-lg font-bold text-foreground">
              سجل تفاعلات وتواصل العملاء
            </h3>
            {hasItems && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {toArabicDigits(timeframeItems.length)} حركة
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            العملاء الذين طلبوا رقم هاتفك أو راسلوك عبر واتساب للتنسيق والعمل
          </p>
        </div>

        {/* مبدل الفترة الزمنية المدمج */}
        {hasItems && (
          <div
            role="group"
            aria-label="تحديد الفترة الزمنية"
            className="flex items-center self-start sm:self-auto rounded-xl bg-background/80 p-1 border border-border/70 text-xs font-semibold shadow-2xs"
          >
            {TIMEFRAMES.map((tf) => {
              const isActive = timeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id)}
                  aria-pressed={isActive}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                    isActive
                      ? "bg-card text-foreground shadow-xs font-bold border border-border/60"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* شريط فلاتر طريقة التواصل والعملاء */}
      {hasItems && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-accent text-accent-foreground shadow-xs"
                    : "bg-muted/10 text-muted hover:bg-muted/20 hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-xs ${
                    isActive ? "bg-accent-foreground/20 text-accent-foreground" : "bg-muted/20 text-muted"
                  }`}
                >
                  {toArabicDigits(tab.count)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Feed List with Timeline Design */}
      {!hasItems || filteredItems.length === 0 ? (
        <div className="pt-6 pb-2">
          <EmptyState
            icon={<IconPhone className="h-6 w-6 text-muted" />}
            title={
              !hasItems
                ? "لا توجد تفاعلات مسجلة بعد"
                : "لا توجد تفاعلات مطابقة لهذا الفلتر"
            }
            description={
              !hasItems
                ? "ستظهر هنا العمليات فور قيام العملاء بالضغط على الاتصال أو مراسلتك على واتساب."
                : "جرّب تغيير الفترة الزمنية أو اختيار فلتر آخر لعرض باقي التفاعلات."
            }
            action={
              hasItems && (activeFilter !== "all" || timeframe !== "all") ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("all");
                    setTimeframe("all");
                  }}
                  className="text-xs font-bold text-accent hover:underline"
                >
                  عرض جميع التفاعلات
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="relative mt-4 space-y-3 before:absolute before:right-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
          {filteredItems.map((item) => {
            const isWhatsapp = item.contactMethod === "whatsapp";
            const isAuthenticated = item.userStatus === "authenticated";

            return (
              <div
                key={item.id}
                className="relative flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/50 p-3 sm:p-3.5 transition-all hover:border-accent/30 hover:bg-background/80"
              >
                {/* Visual Timeline Node */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ring-4 ring-card ${
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

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                      <span className="font-bold text-foreground">
                        {isWhatsapp
                          ? "تواصل معك عبر واتساب"
                          : "طلب الاتصال برقم هاتفك"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                          isAuthenticated
                            ? "bg-accent/15 text-accent"
                            : "bg-muted/15 text-muted"
                        }`}
                      >
                        {isAuthenticated ? (
                          <>
                            <IconUser className="h-3 w-3" />
                            <span>
                              {item.userDisplayName
                                ? item.userDisplayName
                                : "عميل مسجل"}
                            </span>
                          </>
                        ) : (
                          "زائر للموقع"
                        )}
                      </span>
                    </div>

                    <div className="mt-0.5 text-xs text-muted flex items-center gap-2">
                      <span>
                        {new Date(item.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString("ar-EG", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Relative timestamp */}
                <div className="shrink-0 text-left text-xs font-semibold text-muted">
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
