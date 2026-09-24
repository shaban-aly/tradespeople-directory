import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import {
  fetchAreas,
  fetchCategories,
  fetchCraftsmen,
  fetchMessages,
  fetchReports,
  fetchRequests,
  fetchAdminActivityFeed,
} from "@/lib/db/admin";
import { fetchAnalyticsOverview } from "@/lib/db/analytics";
import { OverviewSection } from "./OverviewSection";
import type { Timeframe } from "@/components/admin/ActivityFeed";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ timeframe?: string }>;
}) {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const params = searchParams ? await searchParams : {};
  const rawTimeframe = params?.timeframe;
  const timeframe: Timeframe =
    rawTimeframe === "week" || rawTimeframe === "month" ? rawTimeframe : "today";

  const [requests, reports, categories, areas, craftsmen, messages, analytics, activityFeed] =
    await Promise.all([
      fetchRequests(supabase),
      fetchReports(supabase),
      fetchCategories(supabase),
      fetchAreas(supabase),
      fetchCraftsmen(supabase),
      fetchMessages(supabase),
      fetchAnalyticsOverview(supabase),
      fetchAdminActivityFeed(supabase, timeframe),
    ]);

  return (
    <OverviewSection
      initialData={{ requests, reports, categories, areas, craftsmen, messages }}
      initialAnalytics={analytics}
      activityFeed={activityFeed}
      timeframe={timeframe}
    />
  );
}