import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { fetchCategories, fetchAdminBreakdownCounts } from "@/lib/db/admin";
import { CategoriesSection } from "./CategoriesSection";

export default async function CategoriesPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const [categories, breakdown] = await Promise.all([
    fetchCategories(supabase),
    fetchAdminBreakdownCounts(supabase),
  ]);

  return (
    <CategoriesSection
      initialData={{ categories, categoryCounts: breakdown.byCategory }}
    />
  );
}