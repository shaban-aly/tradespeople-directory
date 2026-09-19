import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import {
  getCraftsmanDashboardData,
  getAreasList,
} from "@/lib/db/craftsman-dashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ProfileEditForm } from "@/components/dashboard/ProfileEditForm";

export default async function CraftsmanProfileEditPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const [data, areas] = await Promise.all([
    getCraftsmanDashboardData(user.id, supabase),
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