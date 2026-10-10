import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import {
  fetchAdminActivityFeed,
  fetchAdminOverviewMetrics,
} from "@/lib/db/admin";
import { fetchAnalyticsOverview } from "@/lib/db/analytics";
import { OverviewSection } from "./OverviewSection";
import type { Timeframe } from "@/components/admin/ActivityFeed";
import type { OverviewTab } from "@/components/admin/overview/OverviewTabs";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ timeframe?: string; tab?: string }>;
}) {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const params = searchParams ? await searchParams : {};
  const rawTimeframe = params?.timeframe;
  const timeframe: Timeframe =
    rawTimeframe === "week" || rawTimeframe === "month" ? rawTimeframe : "today";

  const rawTab = params?.tab;
  const initialTab: OverviewTab =
    rawTab === "analytics" || rawTab === "manage" ? rawTab : "summary";

  const [metrics, analytics, activityFeed] = await Promise.all([
    fetchAdminOverviewMetrics(supabase),
    fetchAnalyticsOverview(supabase),
    fetchAdminActivityFeed(supabase, timeframe),
  ]);

  return (
    <OverviewSection
      initialData={metrics}
      initialAnalytics={analytics}
      activityFeed={activityFeed}
      timeframe={timeframe}
      initialTab={initialTab}
    />
  );
}