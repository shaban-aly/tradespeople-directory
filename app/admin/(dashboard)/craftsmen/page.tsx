import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import {
  fetchAreas,
  fetchCategories,
  fetchPaginatedCraftsmen,
} from "@/lib/db/admin";
import { CraftsmenSection } from "./CraftsmenSection";
import type { CraftsmanFilter } from "@/lib/db/admin-selectors";

export const dynamic = "force-dynamic";

export default async function CraftsmenPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    category?: string;
    published?: string;
    verified?: string;
  }>;
}) {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params.page) || 1);
  const filter: CraftsmanFilter = {
    search: params.search || "",
    category: params.category || "all",
    published: (params.published as CraftsmanFilter["published"]) || "all",
    verified: (params.verified as CraftsmanFilter["verified"]) || "all",
  };

  const [categories, areas] = await Promise.all([
    fetchCategories(supabase),
    fetchAreas(supabase),
  ]);

  const { craftsmen, totalCount, pageCount } = await fetchPaginatedCraftsmen(
    supabase,
    {
      page,
      pageSize: 8,
      search: filter.search,
      category: filter.category,
      published: filter.published,
      verified: filter.verified,
    },
    categories,
  );

  return (
    <CraftsmenSection
      initialData={{ categories, areas, craftsmen }}
      initialFilter={filter}
      initialPagination={{
        page,
        pageCount,
        totalCount,
      }}
    />
  );
}