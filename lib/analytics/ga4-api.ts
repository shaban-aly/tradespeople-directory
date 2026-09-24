/**
 * GA4 Data API — جلب إحصائيات الموقع الحقيقية (Sessions, Active Users, Page Views)
 * يعمل على السيرفر فقط — credentials لا تُكشف للعميل أبداً.
 *
 * المصادقة: Service Account JSON من Google Cloud
 * Property ID: من NEXT_PUBLIC_GA_PROPERTY_ID أو GA_PROPERTY_ID
 */
import { BetaAnalyticsDataClient } from "@google-analytics/data";

// ==================== Types ====================

export type GA4DayStat = {
  date: string; // YYYYMMDD
  sessions: number;
  activeUsers: number;
  screenPageViews: number;
};

export type GA4SiteSummary = {
  /** جلسات اليوم */
  sessionsToday: number;
  /** مستخدمون نشطون اليوم */
  activeUsersToday: number;
  /** مشاهدات كل صفحات الموقع اليوم */
  pageViewsToday: number;
  /** زوار جدد اليوم */
  newUsersToday: number;
  /** خط زمني آخر 7 أيام (sessions + pageViews يومياً) */
  daily7d: GA4DayStat[];
};

const EMPTY_SUMMARY: GA4SiteSummary = {
  sessionsToday: 0,
  activeUsersToday: 0,
  pageViewsToday: 0,
  newUsersToday: 0,
  daily7d: [],
};

// ==================== Client Singleton ====================

let _client: BetaAnalyticsDataClient | null = null;

function getGA4Client(): BetaAnalyticsDataClient | null {
  if (_client) return _client;

  const raw = process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    const credentials: Record<string, unknown> = JSON.parse(raw) as Record<string, unknown>;
    _client = new BetaAnalyticsDataClient({ credentials });
    return _client;
  } catch {
    console.error("[ga4-api] فشل تحليل GA_SERVICE_ACCOUNT_JSON");
    return null;
  }
}

// ==================== Main Fetch ====================

/**
 * يجلب ملخص الجلسات والزوار ومشاهدات الصفحات اليوم وخط زمني 7 أيام.
 * يعيد EMPTY_SUMMARY بصمت عند غياب الـ credentials أو فشل الاتصال.
 */
export async function fetchGA4SiteSummary(): Promise<GA4SiteSummary> {
  const client = getGA4Client();
  const propertyId =
    process.env.GA_PROPERTY_ID ?? process.env.NEXT_PUBLIC_GA_PROPERTY_ID;

  if (!client || !propertyId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ga4-api] GA4 Data API غير مفعّل — GA_SERVICE_ACCOUNT_JSON أو GA_PROPERTY_ID غائب");
    }
    return EMPTY_SUMMARY;
  }

  const property = `properties/${propertyId}`;

  try {
    // استعلامان بالتوازي: اليوم + آخر 7 أيام
    const [todayRes, weekRes] = await Promise.all([
      // ملخص اليوم
      client.runReport({
        property,
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "screenPageViews" },
        ],
      }),
      // خط زمني 7 أيام يومياً
      client.runReport({
        property,
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      }),
    ]);

    // استخراج أرقام اليوم
    const todayRow = todayRes[0]?.rows?.[0]?.metricValues ?? [];
    const sessionsToday = toInt(todayRow[0]?.value);
    const activeUsersToday = toInt(todayRow[1]?.value);
    const newUsersToday = toInt(todayRow[2]?.value);
    const pageViewsToday = toInt(todayRow[3]?.value);

    // استخراج خط 7 أيام
    const daily7d: GA4DayStat[] = (weekRes[0]?.rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      sessions: toInt(row.metricValues?.[0]?.value),
      activeUsers: toInt(row.metricValues?.[1]?.value),
      screenPageViews: toInt(row.metricValues?.[2]?.value),
    }));

    return {
      sessionsToday,
      activeUsersToday,
      pageViewsToday,
      newUsersToday,
      daily7d,
    };
  } catch (err) {
    console.error("[ga4-api] فشل جلب بيانات GA4:", err);
    return EMPTY_SUMMARY;
  }
}

// ==================== Helpers ====================

function toInt(value: string | null | undefined): number {
  const n = parseInt(value ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}
