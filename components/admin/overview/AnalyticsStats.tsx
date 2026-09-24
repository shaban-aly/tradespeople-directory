import type { AnalyticsOverview, DailyPoint } from "@/lib/db/analytics";
import { AdminSection } from "@/components/admin/AdminSection";
import { StatCard } from "@/components/admin/StatCard";
import { StatsDonut } from "@/components/admin/overview/StatsDonut";
import {
  StatsTrendChart,
  StatsTrendLegend,
} from "@/components/admin/overview/StatsTrendChart";
import {
  IconArrowUp,
  IconChart,
  IconHeart,
  IconStar,
  IconTrendingUp,
  IconUsers,
} from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";

/** نسبة تغيّر آخر يومين (pv مقارنة باليوم الأحدث) — null حين لا يمكن احتسابها */
function lastTwoChange(daily: DailyPoint[]): number | null {
  if (daily.length < 2) return null;
  const prev = daily[daily.length - 2];
  const last = daily[daily.length - 1];
  if (!prev || prev.views <= 0) return null;
  return (last.views - prev.views) / prev.views;
}

export function AnalyticsStats({
  analytics,
  loading,
  error,
  totals,
  ga4,
  ga4Loading,
}: {
  analytics: AnalyticsOverview | null;
  loading: boolean;
  error: string;
  totals: { calls: number; whatsapp: number; views: number };
  ga4?: {
    sessionsToday: number;
    activeUsersToday: number;
    pageViewsToday: number;
    newUsersToday: number;
  } | null;
  ga4Loading?: boolean;
}) {
  const ready = analytics && !loading;
  const value = (raw: number | undefined) => (ready ? toArabicDigits(raw ?? 0) : "—");
  const daily = ready ? analytics?.daily ?? [] : [];
  const change = ready ? lastTwoChange(daily) : null;

  const changeLabel =
    change === null
      ? "—"
      : `${change >= 0 ? "+" : "−"}${toArabicDigits(Math.abs(Math.round(change * 100)))}٪`;

  const conversion = ready
    ? `${toArabicDigits(Math.round((analytics?.conversionRate7d ?? 0) * 100))}٪`
    : "—";

  const rating = ready
    ? toArabicDigits(Number(analytics?.averageRating?.toFixed(1) ?? "0"))
    : "—";

  const ga4Value = (n: number | undefined) =>
    ga4Loading ? "—" : toArabicDigits(n ?? 0);

  return (
    <AdminSection
      title="حقائق الموقع والتفاعل"
      description={
        error ||
        "بيانات مباشرة من قاعدة البيانات (تفاعل الصنايعية) وGoogle Analytics 4 (جلسات الزوار)"
      }
      icon={<IconChart className="h-6 w-6" />}
    >
      {/* ── قسم GA4: زيارات الموقع الحقيقية ── */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
            </svg>
            Google Analytics 4
          </span>
          <span className="text-xs text-muted">زيارات الموقع الفعلية اليوم</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
            <div className="text-xs text-muted mb-1">جلسات اليوم</div>
            <div className="font-heading text-2xl font-extrabold text-foreground">
              {ga4Value(ga4?.sessionsToday)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
            <div className="text-xs text-muted mb-1">زوار نشطون</div>
            <div className="font-heading text-2xl font-extrabold text-foreground">
              {ga4Value(ga4?.activeUsersToday)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
            <div className="text-xs text-muted mb-1">زوار جدد</div>
            <div className="font-heading text-2xl font-extrabold text-foreground">
              {ga4Value(ga4?.newUsersToday)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3 text-center">
            <div className="text-xs text-muted mb-1">مشاهدات كل الصفحات</div>
            <div className="font-heading text-2xl font-extrabold text-foreground">
              {ga4Value(ga4?.pageViewsToday)}
            </div>
          </div>
        </div>
      </div>

      {/* ── قسم Supabase: تفاعل الصنايعية ── */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {/* هيرو اليوم */}
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:gap-4 sm:p-5 lg:col-span-1">
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="inline-flex rounded-full bg-muted/20 px-2 py-0.5 text-xs font-bold text-muted">
                Supabase DB
              </span>
            </div>
            <p className="text-sm leading-snug text-muted">مشاهدات صفحات الصنايعية اليوم</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-heading text-4xl font-extrabold leading-none text-foreground sm:text-5xl">
                {value(analytics?.viewsToday)}
              </span>
              {change !== null ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                    change >= 0 ? "bg-action/10 text-action" : "bg-accent/10 text-accent"
                  }`}
                  title="مقارنة باليوم السابق"
                >
                  <IconArrowUp
                    className={`h-3.5 w-3.5 ${change < 0 ? "rotate-180" : ""}`}
                  />
                  {changeLabel}
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-accent/10 px-2 py-1 text-xs font-bold text-accent">
                  {changeLabel}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="grid gap-0.5 rounded-xl bg-muted/15 p-2">
              <span className="font-heading text-lg font-extrabold text-foreground">
                {value(analytics?.callsToday)}
              </span>
              <span className="text-xs text-muted">اتصال</span>
            </div>
            <div className="grid gap-0.5 rounded-xl bg-muted/15 p-2">
              <span className="font-heading text-lg font-extrabold text-foreground">
                {value(analytics?.whatsappToday)}
              </span>
              <span className="text-xs text-muted">واتساب</span>
            </div>
            <div className="grid gap-0.5 rounded-xl bg-muted/15 p-2">
              <span className="font-heading text-lg font-extrabold text-foreground">
                {value(analytics?.contactsToday)}
              </span>
              <span className="text-xs text-muted">تواصل</span>
            </div>
          </div>
          <p className="text-xs leading-snug text-muted">
            كل الفترات: {toArabicDigits(totals.views)} مشاهدات ·{" "}
            {toArabicDigits(totals.calls)} اتصال · {toArabicDigits(totals.whatsapp)} واتساب
          </p>
        </div>

        {/* حلقة نسبة التحويل */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <StatsDonut
            fraction={analytics?.conversionRate7d ?? 0}
            display={
              <>
                {conversion}
                <span className="ms-1 align-middle text-xs text-muted">٪</span>
              </>
            }
            label="معدل التحويل (7 أيام)"
            sublabel="تواصل ÷ مشاهدات لآخر 7 أيام"
            strokeClass="stroke-accent"
          />
        </div>

        {/* حلقة متوسط التقييم */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <StatsDonut
            fraction={(analytics?.averageRating ?? 0) / 5}
            display={
              <>
                {rating}
                <span className="ms-1 align-middle text-xs text-muted">/ ٥</span>
              </>
            }
            label="متوسط تقييم العملاء"
            sublabel="على كل الصنايعية في الدليل"
            strokeClass="stroke-action"
          />
        </div>
      </div>

      {/* خط الزمن 7 أيام */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:gap-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-base font-bold text-foreground sm:text-lg">
            حركة التفاعل — آخر 7 أيام
          </h3>
          <StatsTrendLegend />
        </div>
        <StatsTrendChart points={daily} />
      </div>

      {/* عدّادات ثانوية */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={<IconUsers className="h-6 w-6" />}
          label="مستخدمون مسجلون"
          value={value(analytics?.totalUsers)}
          hint="حسابات عبر Supabase Auth"
        />
        <StatCard
          icon={<IconChart className="h-6 w-6" />}
          label="صنايعية منشورون"
          value={value(analytics?.publishedCraftsmen)}
          hint="approved + is_published"
        />
        <StatCard
          icon={<IconTrendingUp className="h-6 w-6" />}
          label="طلبات بانتظار المعاينة"
          value={value(analytics?.pendingRequests)}
          hint="في سكشن الطلبات"
        />
        <StatCard
          icon={<IconStar className="h-6 w-6" />}
          label="تقييمات العملاء"
          value={value(analytics?.totalReviews)}
          hint="إجمالي التقييمات"
        />
        <StatCard
          icon={<IconHeart className="h-6 w-6" />}
          label="إضافات للمفضلة"
          value={value(analytics?.totalFavorites)}
          hint="مرات الحفظ الكلية"
        />
        <StatCard
          icon={<IconHeart className="h-6 w-6" />}
          label="صنايعية في المفضلة"
          value={value(analytics?.favoritesCraftsmen)}
          hint="صنايعي محفوظ فريد"
        />
      </div>
    </AdminSection>
  );
}