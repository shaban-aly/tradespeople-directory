import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import {
  getCraftsmanDashboardData,
} from "@/lib/db/craftsman-dashboard";
import { getAreasList } from "@/lib/db/craftsman-mutations";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ProfileCompletionCard } from "@/components/dashboard/ProfileCompletionCard";
import { ProfileEditForm } from "@/components/dashboard/ProfileEditForm";

export default async function CraftsmanProfileEditPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const { data: firstCraftsman } = await supabase
    .from("craftsmen")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("added_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [data, areas] = await Promise.all([
    firstCraftsman
      ? getCraftsmanDashboardData(user.id, firstCraftsman.id, supabase)
      : Promise.resolve(null),
    getAreasList(supabase),
  ]);

  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
        <p className="text-base text-muted">
          لا يمكن تعديل البيانات — حسابك غير مرتبط بصفحة صنايعي.
        </p>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader profile={data.profile} />
      <DashboardNav />
      <ProfileCompletionCard profile={data.profile} hideActionLink={true} />
      <Suspense
        fallback={
          <div className="h-96 w-full animate-pulse rounded-2xl border border-border bg-card" />
        }
      >
        <ProfileEditForm
          key={data.profile.imageUrl ?? "no-image"}
          profile={data.profile}
          initialAreas={areas}
        />
      </Suspense>
    </>
  );
}