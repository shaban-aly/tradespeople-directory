import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { fetchAreas, fetchAdminBreakdownCounts } from "@/lib/db/admin";
import { AreasSection } from "./AreasSection";

export default async function AreasPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const [areas, breakdown] = await Promise.all([
    fetchAreas(supabase),
    fetchAdminBreakdownCounts(supabase),
  ]);

  return (
    <AreasSection
      initialData={{ areas, areaCounts: breakdown.byArea }}
    />
  );
}