import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { fetchRequests } from "@/lib/db/admin";
import { RequestsSection } from "./RequestsSection";

export default async function RequestsPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const requests = await fetchRequests(supabase);

  return <RequestsSection initialRequests={requests} />;
}