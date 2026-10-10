import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "@/lib/db/server";
import { fetchCategories } from "@/lib/db/admin";
import { fetchAdminLeadsPageAction } from "@/app/actions/admin-leads";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { LeadsSection } from "./LeadsSection";
import { parseLeadFilterParams } from "@/lib/db/admin-selectors";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "عروض العملاء | لوحة التحكم",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const resolved = searchParams ? await searchParams : {};
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value) && value.length > 0) {
      params.set(key, value[0]);
    }
  }
  const { filter, page } = parseLeadFilterParams(params);

  const [pageData, categories] = await Promise.all([
    fetchAdminLeadsPageAction({ filter, page }),
    fetchCategories(supabase),
  ]);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <LeadsSection initialData={{ page: pageData, categories }} />
    </Suspense>
  );
}

