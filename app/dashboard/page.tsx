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
import { DashboardChips } from "@/components/dashboard/DashboardChips";
import { CraftsmanStatsGrid } from "@/components/dashboard/CraftsmanStatsGrid";
import { CraftsmanActivityFeed } from "@/components/dashboard/CraftsmanActivityFeed";
import { ReviewsSection } from "@/components/dashboard/ReviewsSection";
import { ProfileSwitcher } from "@/components/dashboard/ProfileSwitcher";
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
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
        <p className="text-sm text-muted">تعذّر تحميل بيانات الملف المحدد.</p>
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
      {/* العمود الجانبي الأيمن: هوية الفني والتنقل وجاهزية الملف (4 أعمدة) */}
      <div className="lg:col-span-4 space-y-6">
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
        <DashboardChips variant="sidebar" />
        <ProfileCompletionCard profile={data.profile} />
      </div>

      {/* العمود الرئيسي الأيسر: الإحصائيات، سجل التفاعلات، والمراجعات (8 أعمدة) */}
      <div className="lg:col-span-8 space-y-6">
        <CraftsmanStatsGrid stats={data.stats} />
        <CraftsmanActivityFeed items={data.recentInteractions} />
        <ReviewsSection
          rating={data.stats.rating}
          reviews={data.stats.reviews}
          slug={data.profile.slug}
        />
      </div>
    </div>
  );
}