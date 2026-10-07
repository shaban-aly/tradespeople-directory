import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "@/lib/db/server";
import { fetchCategories } from "@/lib/db/admin";
import { fetchAdminLeadsPageAction } from "@/app/actions/admin-leads";
import { DashboardLoading } from "@/components/admin/DashboardLoading";
import { LeadsSection } from "./LeadsSection";
import type { LeadFilter } from "@/lib/db/admin-selectors";

export const metadata = {
  title: "عروض العملاء | لوحة التحكم",
};

const DEFAULT_FILTER: LeadFilter = {
  search: "",
  category: "all",
  status: "all",
  visibility: "all",
  sort: "newest",
};

export default async function LeadsPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const [page, categories] = await Promise.all([
    fetchAdminLeadsPageAction({ filter: DEFAULT_FILTER, page: 1 }),
    fetchCategories(supabase),
  ]);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <LeadsSection initialData={{ page, categories }} />
    </Suspense>
  );
}
