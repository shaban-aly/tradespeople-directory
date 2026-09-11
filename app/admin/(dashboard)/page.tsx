import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import {
  fetchAreas,
  fetchCategories,
  fetchCraftsmen,
  fetchMessages,
  fetchReports,
  fetchRequests,
} from "@/lib/db/admin";
import { fetchAnalyticsOverview } from "@/lib/db/analytics";
import { OverviewSection } from "./OverviewSection";

export default async function OverviewPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const [requests, reports, categories, areas, craftsmen, messages, analytics] =
    await Promise.all([
      fetchRequests(supabase),
      fetchReports(supabase),
      fetchCategories(supabase),
      fetchAreas(supabase),
      fetchCraftsmen(supabase),
      fetchMessages(supabase),
      fetchAnalyticsOverview(supabase),
    ]);

  return (
    <OverviewSection
      initialData={{ requests, reports, categories, areas, craftsmen, messages }}
      initialAnalytics={analytics}
    />
  );
}