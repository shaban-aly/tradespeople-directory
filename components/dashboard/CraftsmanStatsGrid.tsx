import { toArabicDigits } from "@/lib/utils/format";
import type { CraftsmanDashboardStats } from "@/lib/db/craftsman-dashboard";
import { IconEye, IconHeart, IconPhone, IconStar } from "@/components/shared/icons";

interface CraftsmanStatsGridProps {
  stats: CraftsmanDashboardStats;
}

export function CraftsmanStatsGrid({ stats }: CraftsmanStatsGridProps) {
  const cards = [
    {
      id: "stat-contacts",
      title: "تم التواصل",
      subtitle: "مكالمات ورسائل واتساب",
      value: toArabicDigits(stats.totalContacts),
      icon: <IconPhone className="h-5 w-5" />,
      badgeColor: "bg-action/10 text-action",
      accentBorder: "border-r-4 border-r-action",
    },
    {
      id: "stat-views",
      title: "مشاهدات البروفايل",
      subtitle: "زيارات لصفحتك بالدليل",
      value: toArabicDigits(stats.views),
      icon: <IconEye className="h-5 w-5" />,
      badgeColor: "bg-accent/10 text-accent",
      accentBorder: "border-r-4 border-r-accent",
    },
    {
      id: "stat-favorites",
      title: "في المفضلة",
      subtitle: "عملاء حفظوا رقمك عندهم",
      value: toArabicDigits(stats.favoritesCount),
      icon: <IconHeart className="h-5 w-5" />,
      badgeColor: "bg-rose-500/10 text-rose-500",
      accentBorder: "border-r-4 border-r-rose-500",
    },
    {
      id: "stat-rating",
      title: "التقييم العام",
      subtitle: `${toArabicDigits(stats.rating.totalReviews)} تقييم مسجل`,
      value: `${toArabicDigits(stats.rating.average.toFixed(1))} / ${toArabicDigits(5)}`,
      icon: <IconStar className="h-5 w-5" />,
      badgeColor: "bg-amber-500/10 text-amber-600",
      accentBorder: "border-r-4 border-r-amber-500",
    },
  ];

  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        إحصائيات التفاعل والأداء
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`
              relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4
              shadow-card transition-all duration-200 hover:shadow-md
              ${card.accentBorder}
            `}
          >
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.badgeColor}`}
              aria-hidden="true"
            >
              {card.icon}
            </span>

            <div className="mt-3">
              <p className="font-heading text-2xl font-black text-foreground sm:text-3xl">
                {card.value}
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {card.title}
              </p>
              <p className="mt-0.5 text-xs text-muted leading-tight">
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}