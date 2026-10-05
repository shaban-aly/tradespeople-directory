import { notFound } from "next/navigation";
import { fetchPushDiagnostics } from "@/lib/db/admin";
import { getServerSession } from "@/lib/db/server";
import { DiagnosticsSection } from "./DiagnosticsSection";

export default async function DiagnosticsPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const diagnostics = await fetchPushDiagnostics(supabase);

  return <DiagnosticsSection initialDiagnostics={diagnostics} />;
}
