import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import {
  fetchAreas,
  fetchCategories,
  fetchCraftsmen,
  fetchMessages,
  fetchRequests,
} from "@/lib/db/admin";
import { fetchAnalyticsOverview } from "@/lib/db/analytics";
import { OverviewSection } from "./OverviewSection";

export default async function OverviewPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const [requests, categories, areas, craftsmen, messages, analytics] =
    await Promise.all([
      fetchRequests(supabase),
      fetchCategories(supabase),
      fetchAreas(supabase),
      fetchCraftsmen(supabase),
      fetchMessages(supabase),
      fetchAnalyticsOverview(supabase),
    ]);

  return (
    <OverviewSection
      initialData={{ requests, categories, areas, craftsmen, messages }}
      initialAnalytics={analytics}
    />
  );
}