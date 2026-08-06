import type { AnalyticsOverview } from "@/app/api/analytics/route";
import { AdminSection } from "@/components/admin/AdminSection";
import { StatCard } from "@/components/admin/StatCard";
import {
  IconChart,
  IconEye,
  IconPhone,
  IconTrendingUp,
  IconUsers,
  IconWhatsApp,
} from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

export function AnalyticsStats({
  analytics,
  loading,
  error,
  totals,
}: {
  analytics: AnalyticsOverview | null;
  loading: boolean;
  error: string;
  totals: { calls: number; whatsapp: number; views: number };
}) {
  const value = (raw: number | undefined) =>
    analytics && !loading ? toArabicDigits(raw ?? 0) : "—";

  return (
    <AdminSection
      title="إحصائيات الزيارات"
      description={
        error ||
        "زوار فريدون وفتحات الصفحات ومعدل التحويل — من قاعدة البيانات مباشرة"
      }
      icon={<IconChart className="h-6 w-6" />}
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={<IconUsers className="h-6 w-6" />}
          label="زوار فريدون اليوم"
          value={value(analytics?.todayUsers)}
          hint="أجهزة مختلفة حسب هوية الزائر"
        />
        <StatCard
          icon={<IconUsers className="h-6 w-6" />}
          label="زوار فريدون آخر 7 أيام"
          value={value(analytics?.weekUsers)}
          hint="أجهزة مختلفة حسب هوية الزائر"
        />
        <StatCard
          icon={<IconEye className="h-6 w-6" />}
          label="مشاهدات اليوم"
          value={value(analytics?.todayPageviews)}
          hint="فتحات صفحات التفاصيل"
        />
        <StatCard
          icon={<IconEye className="h-6 w-6" />}
          label="مشاهدات آخر 7 أيام"
          value={value(analytics?.weekPageviews)}
          hint="فتحات صفحات التفاصيل"
        />
        <StatCard
          icon={<IconTrendingUp className="h-6 w-6" />}
          label="معدل التحويل"
          value={
            analytics && !loading
              ? `${toArabicDigits(analytics.conversionRate)}%`
              : "—"
          }
          hint="جلسات تواصل ÷ جلسات مشاهدة"
        />
        <StatCard
          icon={<IconPhone className="h-6 w-6" />}
          label="ضغطات الموبايل"
          value={toArabicDigits(totals.calls)}
          hint="على زراير الاتصال"
        />
        <StatCard
          icon={<IconWhatsApp className="h-6 w-6" />}
          label="ضغطات الواتساب"
          value={toArabicDigits(totals.whatsapp)}
          hint="على زراير الواتساب"
        />
        <StatCard
          icon={<IconChart className="h-6 w-6" />}
          label="إجمالي مشاهدات الصفحات"
          value={toArabicDigits(totals.views)}
          hint="كل مرة تُفتح صفحة تفاصيل"
        />
      </div>
    </AdminSection>
  );
}
