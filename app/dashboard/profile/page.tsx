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
import { CraftsmanDashboardHeader } from "@/components/dashboard/CraftsmanDashboardHeader";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
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

  // حساب العروض المفتوحة لكل ملف لعرضها في المبدّل وتبويب العروض
  const openCountsRecord: Record<string, number> = {};
  let totalOpenLeads = 0;
  if (board.kind !== "no-profile") {
    totalOpenLeads = board.open.length;
    const openCounts = countOpenByCraftsman(board.open);
    openCounts.forEach((count, id) => {
      openCountsRecord[id] = count;
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. ترويسة لوحة الفني الموحدة (الهوية، مبدل الملفات، إجراءات المعاينة، وشريط التبويبات) */}
      <CraftsmanDashboardHeader
        profile={data.profile}
        craftsmen={briefs}
        activeCraftsmanId={activeId}
        counts={openCountsRecord}
        openLeadsCount={totalOpenLeads}
      />

      {/* 2. الهيكل التفاعلي المتجاوب بعرض max-w-7xl المريح (12 عمود على الديسكتوب) */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* العمود الجانبي (4 أعمدة على الديسكتوب): كارت الصورة والمعاينة الحية وجاهزية الملف */}
        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-4">
          {/* كارت الصورة الشخصية والمحرر المدمج */}
          <div className="order-1 lg:order-1 w-full">
            <DashboardHeader
              profile={data.profile}
              editable={true}
            />
          </div>

          {/* كارت اكتمال الملف وجاهزيته: على الموبايل order-3 بعد البيانات، وعلى الديسكتوب أسفل السايدبار lg:order-2 */}
          <div className="order-3 lg:order-2 w-full">
            <ProfileCompletionCard profile={data.profile} hideActionLink={true} />
          </div>
        </div>

        {/* العمود الرئيسي (8 أعمدة على الديسكتوب): نموذج تحرير وتحديث البيانات المهنية */}
        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-8">
          <div className="order-2 lg:order-1 w-full space-y-6">
            {/* عنوان الصفحة ووصفها التوضيحي */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
              <h1 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                تعديل وتحديث بيانات الملف المهني
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                هذه البيانات هي التي تظهر لعملاء السويس عند زيارة صفحتك في الدليل. احرص على دقة البيانات والصور لجذب المزيد من الزبائن.
              </p>
            </div>

            {/* نموذج إدخال وتعديل البيانات المهنية مع استغلال العرض المريح */}
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
      </div>
    </div>
  );
}