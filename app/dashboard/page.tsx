import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "@/lib/db/server";
import {
  ACTIVE_CRAFTSMAN_COOKIE,
  getCraftsmanDashboardData,
  getMyCraftsmen,
  resolveActiveCraftsman,
} from "@/lib/db/craftsman-dashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProfileCompletionCard } from "@/components/dashboard/ProfileCompletionCard";
import { DashboardSubnav } from "@/components/dashboard/DashboardSubnav";
import { CraftsmanStatsGrid } from "@/components/dashboard/CraftsmanStatsGrid";
import { CraftsmanActivityFeed } from "@/components/dashboard/CraftsmanActivityFeed";
import { ReviewsSection } from "@/components/dashboard/ReviewsSection";
import { ProfileSwitcher } from "@/components/dashboard/ProfileSwitcher";
import { DashboardErrorState } from "@/components/dashboard/DashboardErrorState";
import { ButtonLink } from "@/components/shared/ui/Button";
import { IconUser } from "@/components/shared/icons";

import { countOpenByCraftsman, getCraftsmanLeadsBoard } from "@/lib/db/leads";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ craftsman?: string }>;
}) {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const params = await searchParams;

  // جلب جميع ملفات الصنايعي المملوكة للمستخدم
  const allCraftsmen = await getMyCraftsmen(user.id, supabase);

  if (allCraftsmen.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl text-amber-500">
          <IconUser className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
          حسابك غير مرتبط بصفحة صنايعي بعد
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
          لقد قمت بتسجيل الدخول بنجاح، ولكن حسابك لم يُربط بعد بملف فني في دليل الصنايعية. إذا كنت قد قدمت طلب انضمام سابقاً، فسيتم تفعيل لوحتك بمجرد مراجعة المشرف للطلب.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <ButtonLink
            href="/join"
            variant="action"
            className="w-full sm:w-auto min-h-12 text-base justify-center"
          >
            تقديم طلب انضمام كصنايعي
          </ButtonLink>
          <ButtonLink
            href="/"
            variant="ghost"
            className="w-full sm:w-auto min-h-12 text-base justify-center"
          >
            تصفح دليل الصنايعية
          </ButtonLink>
        </div>
      </div>
    );
  }

  // تحديد الملف النشط: ?craftsman= ثم الكوكي ثم الأحدث — بملكية إجبارية.
  const cookieStore = await cookies();
  const requestedId = params.craftsman;
  const activeCraftsman =
    resolveActiveCraftsman(
      allCraftsmen,
      requestedId,
      cookieStore.get(ACTIVE_CRAFTSMAN_COOKIE)?.value,
    ) ?? allCraftsmen[0];

  const [data, board] = await Promise.all([
    getCraftsmanDashboardData(user.id, activeCraftsman.id, supabase),
    getCraftsmanLeadsBoard(supabase, user.id),
  ]);

  if (!data) {
    return (
      <DashboardErrorState
        hasCustomCraftsmanParam={Boolean(params.craftsman)}
      />
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
      {/* 1. شريط التبويبات الموحد المتصل بعرض الناف بار max-w-7xl */}
      <DashboardSubnav openLeadsCount={totalOpenLeads} />

      {/* 2. الهيكل التفاعلي المتجاوب بعرض max-w-7xl المريح (12 عمود على الديسكتوب) */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* العمود الجانبي (4 أعمدة على الديسكتوب): كارت الصورة والمعاينة وجاهزية الملف */}
        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-4">
          {/* كارت الصورة الكبير وهوية الفني: على الموبايل order-3 بعد سجل التفاعلات، وعلى الديسكتوب في قمة السايدبار lg:order-1 */}
          <div className="order-3 lg:order-1 w-full">
            <DashboardHeader
              profile={data.profile}
              action={
                <ProfileSwitcher
                  craftsmen={allCraftsmen}
                  activeCraftsmanId={activeCraftsman.id}
                  counts={openCountsRecord}
                />
              }
            />
          </div>

          {/* كارت جاهزية واكتمال الملف المهني: على الموبايل order-4، وعلى الديسكتوب أسفل السايدبار lg:order-2 */}
          <div className="order-4 lg:order-2 w-full">
            <ProfileCompletionCard profile={data.profile} />
          </div>
        </div>

        {/* العمود الرئيسي (8 أعمدة على الديسكتوب): الإحصائيات وسجل التفاعلات والمراجعات */}
        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:col-span-8">
          {/* مصفوفة الإحصائيات: على الموبايل تأتي أولاً تحت التبويبات order-1 */}
          <div className="order-1 lg:order-1 w-full">
            <CraftsmanStatsGrid stats={data.stats} />
          </div>

          {/* سجل تفاعلات وتواصل العملاء: على الموبايل order-2 تحت الإحصائيات */}
          <div className="order-2 lg:order-2 w-full">
            <CraftsmanActivityFeed items={data.recentInteractions} />
          </div>

          {/* آراء وتقييمات العملاء: على الموبايل order-5 بعد كروت السايدبار، وعلى الديسكتوب lg:order-3 */}
          <div className="order-5 lg:order-3 w-full">
            <ReviewsSection
              rating={data.stats.rating}
              reviews={data.stats.reviews}
              slug={data.profile.slug}
            />
          </div>
        </div>
      </div>
    </div>
  );
}