import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "@/lib/db/server";
import {
  ACTIVE_CRAFTSMAN_COOKIE,
  getCraftsmanDashboardData,
  getMyCraftsmen,
  resolveActiveCraftsman,
} from "@/lib/db/craftsman-dashboard";
import { getAreasList } from "@/lib/db/craftsman-mutations";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardChips } from "@/components/dashboard/DashboardChips";
import { ProfileSwitcher } from "@/components/dashboard/ProfileSwitcher";
import { ProfileCompletionCard } from "@/components/dashboard/ProfileCompletionCard";
import { ProfileEditForm } from "@/components/dashboard/ProfileEditForm";

import { countOpenByCraftsman, getCraftsmanLeadsBoard } from "@/lib/db/leads";

export const metadata = { title: "تعديل بروفايلي | لوحة التحكم" };

export default async function CraftsmanProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ craftsman?: string }>;
}) {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const params = await searchParams;
  const cookieStore = await cookies();

  const briefs = await getMyCraftsmen(user.id, supabase);

  const activeCraftsman = resolveActiveCraftsman(
    briefs,
    params.craftsman,
    cookieStore.get(ACTIVE_CRAFTSMAN_COOKIE)?.value,
  ) ?? briefs[0];

  const activeId = activeCraftsman?.id;

  const [data, areas, board] = await Promise.all([
    activeId
      ? getCraftsmanDashboardData(user.id, activeId, supabase)
      : Promise.resolve(null),
    getAreasList(supabase),
    getCraftsmanLeadsBoard(supabase, user.id),
  ]);

  if (!data || !activeId) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
        <p className="text-base text-muted">
          لا يمكن تعديل البيانات — حسابك غير مرتبط بصفحة صنايعي.
        </p>
      </div>
    );
  }

  // حساب العروض المفتوحة لكل ملف لعرضها في المبدّل
  const openCountsRecord: Record<string, number> = {};
  if (board.kind !== "no-profile") {
    const openCounts = countOpenByCraftsman(board.open);
    openCounts.forEach((count, id) => {
      openCountsRecord[id] = count;
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* العمود الجانبي الأيمن: الهيدر (المعاينة الحية) والتنقل ونسبة الاكتمال (4 أعمدة) */}
      <div className="lg:col-span-4 space-y-6">
        <DashboardHeader
          profile={data.profile}
          action={
            <ProfileSwitcher
              craftsmen={briefs}
              activeCraftsmanId={activeId}
              counts={openCountsRecord}
            />
          }
        />
        <DashboardChips variant="sidebar" />
        <ProfileCompletionCard profile={data.profile} hideActionLink={true} />
      </div>

      {/* العمود الرئيسي الأيسر: محرر بيانات البروفايل المتكامل (8 أعمدة) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <h1 className="font-heading text-lg sm:text-xl font-bold text-foreground">
            تعديل وتحديث بيانات الملف المهني
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            هذه البيانات هي التي تظهر لعملاء السويس عند زيارة صفحتك في الدليل. احرص على دقة البيانات والصور لجذب المزيد من الزبائن.
          </p>
        </div>

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
      </div>
    </div>
  );
}