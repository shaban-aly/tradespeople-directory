import Link from "next/link";
import {
  IconAlert,
  IconArrow,
  IconInbox,
  IconMail,
  IconSparkles,
} from "@/components/shared/icons";
import type { OverviewMetrics } from "@/lib/db/admin-selectors";
import { toArabicDigits } from "@/lib/utils/format";

type ActionItemConfig = {
  href: string;
  label: string;
  count: number;
  activeHint: string;
  idleHint: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  hoverBorder: string;
};

export function ActionCounters({ metrics }: { metrics: OverviewMetrics }) {
  const items: ActionItemConfig[] = [
    {
      href: "/admin/requests",
      label: "طلبات الانضمام",
      count: metrics.pendingRequests.length,
      activeHint: "بانتظار المراجعة",
      idleHint: "تم فحص الكل",
      icon: <IconInbox className="h-4 w-4 sm:h-5 sm:w-5" />,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      badgeBg: "bg-accent/15",
      badgeText: "text-accent",
      hoverBorder: "hover:border-accent/60",
    },
    {
      href: "/admin/leads",
      label: "عروض العملاء",
      count: metrics.openLeads,
      activeHint: "عروض مفتوحة",
      idleHint: "لا توجد عروض",
      icon: <IconSparkles className="h-4 w-4 sm:h-5 sm:w-5" />,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
      badgeBg: "bg-purple-500/15",
      badgeText: "text-purple-400",
      hoverBorder: "hover:border-purple-500/60",
    },
    {
      href: "/admin/reports",
      label: "بلاغات معلّقة",
      count: metrics.pendingReports.length,
      activeHint: "شكاوى تحتاج تدقيق",
      idleHint: "السجل نظيف",
      icon: <IconAlert className="h-4 w-4 sm:h-5 sm:w-5" />,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      badgeBg: "bg-warning/15",
      badgeText: "text-warning",
      hoverBorder: "hover:border-warning/60",
    },
    {
      href: "/admin/messages",
      label: "رسائل غير مقروءة",
      count: metrics.unreadMessages,
      activeHint: "استفسارات جديدة",
      idleHint: "تم الرد",
      icon: <IconMail className="h-4 w-4 sm:h-5 sm:w-5" />,
      iconBg: "bg-action/10",
      iconColor: "text-action",
      badgeBg: "bg-action/15",
      badgeText: "text-action",
      hoverBorder: "hover:border-action/60",
    },
  ];

  return (
    <section aria-label="بطاقات الإجراءات السريعة" className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
      {items.map((item) => {
        const hasWork = item.count > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${item.hoverBorder}`}
          >
            {/* مؤشر وهج خلفي خفيف للبطاقات التي تحتاج عملاً */}
            {hasWork && (
              <span
                aria-hidden
                className="pointer-events-none absolute -left-8 -top-8 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-accent/5 blur-2xl transition-opacity group-hover:opacity-100"
              />
            )}

            <div>
              {/* الرأس: الأيقونة + شارة الحالة */}
              <div className="flex items-center justify-between gap-1.5">
                <div
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-200 group-hover:scale-105 ${item.iconBg} ${item.iconColor}`}
                >
                  {item.icon}
                </div>

                {hasWork ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 text-xs font-bold ${item.badgeBg} ${item.badgeText}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    <span className="hidden xs:inline sm:inline">إجراء</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-muted/10 px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 text-xs font-medium text-muted">
                    مستقر
                  </span>
                )}
              </div>

              {/* العنوان والرقم */}
              <div className="mt-2 sm:mt-3.5">
                <h3 className="text-xs sm:text-sm font-medium text-muted truncate">
                  {item.label}
                </h3>
                <div className="mt-0.5 sm:mt-1 flex items-baseline gap-1.5">
                  <span className="font-heading text-xl sm:text-3xl font-black text-foreground">
                    {toArabicDigits(item.count)}
                  </span>
                  <span className="hidden sm:inline text-xs text-muted truncate">
                    {hasWork ? item.activeHint : item.idleHint}
                  </span>
                </div>
              </div>
            </div>

            {/* سهم التنقل السفلي — يظهر فقط على الشاشات الأكبر لتقليل الارتفاع على الموبايل */}
            <div className="mt-3 hidden sm:flex items-center justify-between border-t border-border/60 pt-2 text-xs font-bold text-muted transition-colors group-hover:text-foreground">
              <span>عرض التفاصيل</span>
              <IconArrow className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
            </div>
          </Link>
        );
      })}
    </section>
  );
}
