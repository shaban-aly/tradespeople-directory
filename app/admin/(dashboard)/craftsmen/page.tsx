import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { fetchAreas, fetchCategories, fetchCraftsmen } from "@/lib/db/admin";
import { CraftsmenSection } from "./CraftsmenSection";

export default async function CraftsmenPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const [categories, areas, craftsmen] = await Promise.all([
    fetchCategories(supabase),
    fetchAreas(supabase),
    fetchCraftsmen(supabase),
  ]);

  return <CraftsmenSection initialData={{ categories, areas, craftsmen }} />;
}