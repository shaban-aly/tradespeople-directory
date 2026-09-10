import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type AnalyticsOverview = {
  todayUsers: number;
  weekUsers: number;
  todayPageviews: number;
  weekPageviews: number;
  viewSessions: number;
  contactSessions: number;
  conversionRate: number;
};

export async function fetchAnalyticsOverview(
  client: SupabaseClient<Database>,
): Promise<AnalyticsOverview> {
  const { data, error } = await client.rpc("get_analytics_overview");
  if (error) {
    throw new Error("فشل جلب البيانات");
  }
  return data as AnalyticsOverview;
}