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

/**
 * مصفوفة مؤشرات الأداء الحيوية — تصميم عصري خفيف ومدمج (2x2 على الموبايل و 4 على الشاشات الكبيرة)
 * بدون خطوط سميكة فاقعة أو أرقام عملاقة مشتتة.
 */
export function CraftsmanStatsGrid({ stats }: CraftsmanStatsGridProps) {
  const conversionRate =
    stats.views > 0
      ? ((stats.totalContacts / stats.views) * 100).toFixed(1)
      : "0";

  const cards = [
    {
      id: "stat-contacts",
      title: "إجمالي التواصل",
      value: toArabicDigits(stats.totalContacts),
      icon: <IconPhone className="h-4 w-4" />,
      badgeColor: "bg-action/10 text-action",
      subline: (
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
          <span
            className="inline-flex items-center gap-1 text-accent"
            title="مكالمات هاتفية مباشرة"
          >
            <IconPhone className="h-3 w-3" />
            <span>{toArabicDigits(stats.calls ?? 0)} اتصال</span>
          </span>
          <span>•</span>
          <span
            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
            title="محادثات عبر واتساب"
          >
            <IconWhatsApp className="h-3 w-3" />
            <span>{toArabicDigits(stats.whatsapp ?? 0)} واتساب</span>
          </span>
        </div>
      ),
    },
    {
      id: "stat-views",
      title: "مشاهدات البروفايل",
      value: toArabicDigits(stats.views),
      icon: <IconEye className="h-4 w-4" />,
      badgeColor: "bg-accent/10 text-accent",
      subline: (
        <div
          className="flex items-center gap-1 text-xs font-semibold text-accent cursor-help"
          title="نسبة الزوار الذين ضغطوا على رقم هاتفك أو واتساب للتواصل معك من إجمالي المشاهدات"
        >
          <IconTrendingUp className="h-3.5 w-3.5 shrink-0" />
          <span>تواصل {toArabicDigits(conversionRate)}% من الزوار</span>
        </div>
      ),
    },
    {
      id: "stat-favorites",
      title: "في المفضلة",
      value: toArabicDigits(stats.favoritesCount),
      icon: <IconHeart className="h-4 w-4" />,
      badgeColor: "bg-rose-500/10 text-rose-500",
      subline: (
        <span
          className="text-xs font-medium text-muted block truncate"
          title="عملاء قاموا بحفظ رقمك في قائمة المفضلة للاتصال بك لاحقاً"
        >
          {stats.favoritesCount > 0
            ? "عملاء محتفظون برقمك"
            : "لم يضفك أحد للمفضلة بعد"}
        </span>
      ),
    },
    {
      id: "stat-rating",
      title: "التقييم العام",
      value:
        stats.rating.totalReviews > 0
          ? `${toArabicDigits(stats.rating.average.toFixed(1))} / ${toArabicDigits(5)}`
          : "جديد",
      icon: <IconStar className="h-4 w-4" />,
      badgeColor: "bg-amber-500/10 text-amber-500",
      subline: (
        <span
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 block truncate"
          title={
            stats.rating.totalReviews > 0
              ? `متوسط تقييمات العملاء في السويس بناءً على ${toArabicDigits(stats.rating.totalReviews)} تقييم`
              : "شارك رابط صفحتك مع زبائنك الحاليين للحصول على أول تقييم"
          }
        >
          {stats.rating.totalReviews > 0
            ? `${toArabicDigits(stats.rating.totalReviews)} تقييم معتمد`
            : "بانتظار أول تقييم"}
        </span>
      ),
    },
  ];

  return (
    <section aria-labelledby="stats-heading" className="space-y-3">
      <h2 id="stats-heading" className="sr-only">
        إحصائيات التفاعل والأداء
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-accent/40 hover:shadow-sm"
          >
            {/* الأيقونة والعنوان */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-muted truncate">
                {card.title}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${card.badgeColor}`}
                aria-hidden="true"
              >
                {card.icon}
              </span>
            </div>

            {/* القيمة الرئيسية */}
            <div className="mt-2.5">
              <p className="font-heading text-2xl sm:text-3xl font-black text-foreground leading-tight">
                {card.value}
              </p>
            </div>

            {/* السطر الفرعي الدقيق */}
            <div className="mt-2 pt-2 border-t border-border/50">
              {card.subline}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}