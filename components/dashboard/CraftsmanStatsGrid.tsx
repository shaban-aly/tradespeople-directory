import { toArabicDigits } from "@/lib/utils/format";
import type { CraftsmanDashboardStats } from "@/lib/db/craftsman-dashboard";
import {
  IconEye,
  IconHeart,
  IconPhone,
  IconStar,
  IconTrendingUp,
  IconWhatsApp,
} from "@/components/shared/icons";

interface CraftsmanStatsGridProps {
  stats: CraftsmanDashboardStats;
}

export function CraftsmanStatsGrid({ stats }: CraftsmanStatsGridProps) {
  const conversionRate =
    stats.views > 0
      ? ((stats.totalContacts / stats.views) * 100).toFixed(1)
      : "0";

  const cards = [
    {
      id: "stat-contacts",
      title: "إجمالي التواصل",
      subtitle: "مكالمات ورسائل واتساب",
      value: toArabicDigits(stats.totalContacts),
      icon: <IconPhone className="h-5 w-5" />,
      badgeColor: "bg-action/10 text-action",
      borderAccent: "border-b-2 sm:border-b-0 sm:border-s-4 border-action",
      pill: (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted">
          <span className="inline-flex items-center gap-1 text-accent">
            <IconPhone className="h-3 w-3" />
            {toArabicDigits(stats.calls ?? 0)}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <IconWhatsApp className="h-3 w-3" />
            {toArabicDigits(stats.whatsapp ?? 0)}
          </span>
        </div>
      ),
    },
    {
      id: "stat-views",
      title: "مشاهدات البروفايل",
      subtitle: "زيارات لصفحتك بالدليل",
      value: toArabicDigits(stats.views),
      icon: <IconEye className="h-5 w-5" />,
      badgeColor: "bg-accent/10 text-accent",
      borderAccent: "border-b-2 sm:border-b-0 sm:border-s-4 border-accent",
      pill: (
        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-accent">
          <IconTrendingUp className="h-3.5 w-3.5" />
          <span>معدل تحويل {toArabicDigits(conversionRate)}%</span>
        </div>
      ),
    },
    {
      id: "stat-favorites",
      title: "في المفضلة",
      subtitle: "عملاء حفظوا رقمك عندهم",
      value: toArabicDigits(stats.favoritesCount),
      icon: <IconHeart className="h-5 w-5" />,
      badgeColor: "bg-rose-500/10 text-rose-500",
      borderAccent: "border-b-2 sm:border-b-0 sm:border-s-4 border-rose-500",
      pill: (
        <div className="mt-2 text-[11px] font-medium text-muted">
          <span>جاهزون للرجوع إليك</span>
        </div>
      ),
    },
    {
      id: "stat-rating",
      title: "التقييم العام",
      subtitle: `${toArabicDigits(stats.rating.totalReviews)} تقييم مسجل`,
      value:
        stats.rating.totalReviews > 0
          ? `${toArabicDigits(stats.rating.average.toFixed(1))} / ${toArabicDigits(5)}`
          : "جديد",
      icon: <IconStar className="h-5 w-5" />,
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      borderAccent: "border-b-2 sm:border-b-0 sm:border-s-4 border-amber-500",
      pill: (
        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <IconStar className="h-3 w-3 fill-current" />
          <span>
            {stats.rating.totalReviews > 0
              ? stats.rating.average >= 4.5
                ? "تقييم ممتاز"
                : "تقييم جيد"
              : "بانتظار أول تقييم"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <section aria-labelledby="stats-heading" className="grid gap-3">
      <h2 id="stats-heading" className="sr-only">
        إحصائيات التفاعل والأداء
      </h2>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.borderAccent}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${card.badgeColor}`}
                aria-hidden="true"
              >
                {card.icon}
              </span>
            </div>

            <div className="mt-2.5 sm:mt-3">
              <p className="font-heading text-xl font-black text-foreground sm:text-3xl leading-tight">
                {card.value}
              </p>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-bold text-foreground truncate">
                {card.title}
              </p>
              <p className="text-[11px] sm:text-xs text-muted leading-tight truncate">
                {card.subtitle}
              </p>
              {card.pill}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}