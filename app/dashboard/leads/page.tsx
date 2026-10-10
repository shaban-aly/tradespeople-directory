import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "@/lib/db/server";
import {
  ACTIVE_CRAFTSMAN_COOKIE,
  getCraftsmanDashboardData,
  getMyCraftsmen,
  resolveActiveCraftsman,
} from "@/lib/db/craftsman-dashboard";
import {
  countOpenByCraftsman,
  filterBoardByCraftsman,
  getCraftsmanLeadsBoard,
} from "@/lib/db/leads";
import { DashboardSubnav } from "@/components/dashboard/DashboardSubnav";
import { CraftsmanDashboardHeader } from "@/components/dashboard/CraftsmanDashboardHeader";
import { PageTitleRow } from "@/components/shared/ui/PageTitleRow";
import { LeadsBoardView } from "@/components/dashboard/leads/LeadsBoardView";

export const metadata = { title: "عروض العملاء | لوحة التحكم" };

export default async function DashboardLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ craftsman?: string }>;
}) {
  const { supabase, user } = await getServerSession();

  if (!user) redirect("/login?reason=craftsman");

  const params = await searchParams;
  const cookieStore = await cookies();
  const [board, briefs] = await Promise.all([
    getCraftsmanLeadsBoard(supabase, user.id),
    getMyCraftsmen(user.id, supabase),
  ]);

  if (board.kind === "no-profile" || briefs.length === 0) {
    const isUnpublished = board.kind === "no-profile" && board.reason === "unpublished";
    return (
      <div className="space-y-6">
        <PageTitleRow
          title="عروض العملاء"
          description="أسرع بالرد على الطلبات لتفوز بالعمل قبل غيرك."
          backFallback="/dashboard"
          backLabel="رجوع للوحة التحكم"
        />
        <DashboardSubnav />
        <div className="bg-card text-card-foreground p-8 rounded-2xl border border-border/80 text-center shadow-xs">
          {isUnpublished ? (
            <>
              <p className="text-base font-bold text-foreground">حسابك الفني معتمد لكنه غير منشور بعد.</p>
              <p className="text-sm text-muted mt-2">
                سيظهر لك عروض العملاء بعد نشر ملفك من قبل الإدارة.
              </p>
            </>
          ) : (
            <p className="text-base text-muted">
              يجب أن تمتلك حساب صنايعي مقبول لتتمكن من رؤية عروض العملاء.
            </p>
          )}
        </div>
      </div>
    );
  }

  const { open } = board;

  // حل الملف النشط
  const activeCraftsman = resolveActiveCraftsman(
    briefs,
    params.craftsman,
    cookieStore.get(ACTIVE_CRAFTSMAN_COOKIE)?.value,
  ) ?? briefs[0];

  const activeId = activeCraftsman.id;

  // جلب بيانات البروفايل لعرض شريط الهوية المقتضب والمعاينة
  const dashboardData = await getCraftsmanDashboardData(user.id, activeId, supabase);

  // فلترة اللوحة بالملف النشط
  const split = filterBoardByCraftsman(board, activeId);

  const activeClaimed = split.activeClaimed.filter(
    (lead) => lead.status === "open" || lead.status === "claimed",
  );
  const closedClaimed = split.activeClaimed.filter(
    (lead) => lead.status !== "open" && lead.status !== "claimed",
  );
  const otherClaimed = split.otherClaimed;

  // حساب العروض المفتوحة لكل ملف لعرضها في المبدّل والتنبيهات
  const openCounts = countOpenByCraftsman(open);
  const openCountsRecord: Record<string, number> = {};
  openCounts.forEach((count, id) => {
    openCountsRecord[id] = count;
  });

  const otherProfiles = briefs
    .filter((brief) => brief.id !== activeId && (openCounts.get(brief.id) ?? 0) > 0)
    .map((brief) => ({
      id: brief.id,
      categoryName: brief.categoryName || brief.name,
      openCount: openCounts.get(brief.id) ?? 0,
    }));

  return (
    <div className="space-y-6">
      {/* 1. ترويسة لوحة الفني الموحدة (الهوية، مبدل الملفات، إجراءات المعاينة، وشريط التبويبات) */}
      {dashboardData && (
        <CraftsmanDashboardHeader
          profile={dashboardData.profile}
          craftsmen={briefs}
          activeCraftsmanId={activeId}
          counts={openCountsRecord}
          openLeadsCount={split.open.length}
        />
      )}

      {/* 2. لوحة العروض والطلبات التفاعلية بالترتيب الذكي وفلاتر المؤشرات */}
      <LeadsBoardView
        open={split.open}
        activeClaimed={activeClaimed}
        closedClaimed={closedClaimed}
        otherClaimed={otherClaimed}
        otherProfiles={otherProfiles}
      />
    </div>
  );
}
