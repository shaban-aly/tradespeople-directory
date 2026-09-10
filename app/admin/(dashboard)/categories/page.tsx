import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { fetchCategories, fetchCounts } from "@/lib/db/admin";
import { CategoriesSection } from "./CategoriesSection";

export default async function CategoriesPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const [categories, counts] = await Promise.all([
    fetchCategories(supabase),
    fetchCounts(supabase),
  ]);

  return <CategoriesSection initialData={{ categories, counts }} />;
}