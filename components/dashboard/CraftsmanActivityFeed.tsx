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

export function CraftsmanActivityFeed({
  items = [],
}: CraftsmanActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");

  const whatsappCount = items.filter((i) => i.contactMethod === "whatsapp").length;
  const phoneCount = items.filter((i) => i.contactMethod === "phone").length;
  const registeredCount = items.filter((i) => i.userStatus === "authenticated").length;

  const filteredItems = useMemo(() => {
    if (activeFilter === "whatsapp") return items.filter((i) => i.contactMethod === "whatsapp");
    if (activeFilter === "phone") return items.filter((i) => i.contactMethod === "phone");
    if (activeFilter === "registered") return items.filter((i) => i.userStatus === "authenticated");
    return items;
  }, [items, activeFilter]);

  const hasItems = items.length > 0;

  const filterTabs: { id: FeedFilter; label: string; count: number }[] = [
    { id: "all", label: "الكل", count: items.length },
    { id: "whatsapp", label: "واتساب", count: whatsappCount },
    { id: "phone", label: "مكالمات", count: phoneCount },
    { id: "registered", label: "عملاء مسجلون", count: registeredCount },
  ];

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-card">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base sm:text-lg font-bold text-foreground">
              سجل تفاعلات وتواصل العملاء
            </h3>
            {hasItems && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {toArabicDigits(items.length)} حركة
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            العملاء الذين طلبوا رقم هاتفك أو راسلوك عبر واتساب (آخر 30 يوماً)
          </p>
        </div>

        {/* Breakdown counter badges on desktop */}
        {hasItems && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <IconWhatsApp className="h-3.5 w-3.5" />
              {toArabicDigits(whatsappCount)} واتساب
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-accent font-semibold">
              <IconPhone className="h-3.5 w-3.5" />
              {toArabicDigits(phoneCount)} اتصال
            </span>
          </div>
        )}
      </div>

      {/* Filter Chips */}
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
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
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
              activeFilter === "all"
                ? "لا توجد تفاعلات مسجلة مؤخراً"
                : "لا توجد تفاعلات بهذا الفلتر"
            }
            description="ستظهر هنا العمليات فور قيام العملاء بالضغط على الاتصال أو مراسلتك على واتساب."
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
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
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

                    <div className="mt-0.5 text-[11px] text-muted flex items-center gap-2">
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
