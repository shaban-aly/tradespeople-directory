import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * حقائق الموقع للوحة المشرف — تُجمع من `get_site_stats()` (SQL aggregation)
 * دون أي أحداث خام. تشمل عدّادات اليوم وخط زمنياً لآخر 7 أيام (craftsman_stats_daily).
 * سلوك الزوار (جلسات/تحويل/بحث) يُقاس في GA4.
 */
export type DailyPoint = {
  day: string;
  views: number;
  calls: number;
  whatsapp: number;
  contacts: number;
};

export type AnalyticsOverview = {
  totalUsers: number;
  publishedCraftsmen: number;
  pendingRequests: number;
  totalReviews: number;
  averageRating: number;
  totalFavorites: number;
  favoritesCraftsmen: number;
  viewsToday: number;
  callsToday: number;
  whatsappToday: number;
  contactsToday: number;
  /** جزء من 0..1 — ضغطات تواصل ÷ مشاهدات لآخر 7 أيام */
  conversionRate7d: number;
  /** آخر 7 أيام تصاعدياً (قد يحتوي فجوات عند توقف التفاعل) */
  daily: DailyPoint[];
};

const EMPTY_OVERVIEW: AnalyticsOverview = {
  totalUsers: 0,
  publishedCraftsmen: 0,
  pendingRequests: 0,
  totalReviews: 0,
  averageRating: 0,
  totalFavorites: 0,
  favoritesCraftsmen: 0,
  viewsToday: 0,
  callsToday: 0,
  whatsappToday: 0,
  contactsToday: 0,
  conversionRate7d: 0,
  daily: [],
};

const toNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export function normalizeAnalyticsOverview(
  data: unknown,
): AnalyticsOverview {
  const d = (data ?? {}) as Record<string, unknown>;
  const dailyRaw = Array.isArray(d.daily) ? d.daily : [];
  const daily: DailyPoint[] = dailyRaw.map((point) => {
    const p = (point ?? {}) as Record<string, unknown>;
    return {
      day: typeof p.day === "string" ? p.day : "",
      views: toNumber(p.views),
      calls: toNumber(p.calls),
      whatsapp: toNumber(p.whatsapp),
      contacts: toNumber(p.contacts),
    };
  });
  return {
    ...EMPTY_OVERVIEW,
    ...{
      totalUsers: toNumber(d.totalUsers),
      publishedCraftsmen: toNumber(d.publishedCraftsmen),
      pendingRequests: toNumber(d.pendingRequests),
      totalReviews: toNumber(d.totalReviews),
      averageRating: toNumber(d.averageRating),
      totalFavorites: toNumber(d.totalFavorites),
      favoritesCraftsmen: toNumber(d.favoritesCraftsmen),
      viewsToday: toNumber(d.viewsToday),
      callsToday: toNumber(d.callsToday),
      whatsappToday: toNumber(d.whatsappToday),
      contactsToday: toNumber(d.contactsToday),
      conversionRate7d: toNumber(d.conversionRate7d),
    },
    daily,
  };
}

export async function fetchAnalyticsOverview(
  client: SupabaseClient<Database>,
): Promise<AnalyticsOverview> {
  const { data, error } = await client.rpc("get_site_stats");
  if (error) {
    throw new Error("فشل جلب البيانات");
  }
  return normalizeAnalyticsOverview(data);
}