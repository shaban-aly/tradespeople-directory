import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { fetchAreas, fetchCounts } from "@/lib/db/admin";
import { AreasSection } from "./AreasSection";

export default async function AreasPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const [areas, counts] = await Promise.all([
    fetchAreas(supabase),
    fetchCounts(supabase),
  ]);

  return <AreasSection initialData={{ areas, counts }} />;
}