import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { fetchReports } from "@/lib/db/admin";
import { ReportsSection } from "./ReportsSection";

export default async function ReportsPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const reports = await fetchReports(supabase);

  return <ReportsSection initialReports={reports} />;
}