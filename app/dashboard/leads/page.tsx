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
import { PageTitleRow } from "@/components/shared/ui/PageTitleRow";
import { ClosedLeadsGroup } from "@/components/dashboard/leads/ClosedLeadsGroup";
import { OtherProfilesAlert } from "@/components/dashboard/leads/OtherProfilesAlert";
import { OpenLeadsLiveList } from "@/components/dashboard/leads/OpenLeadsLiveList";
import { ClaimedLeadCard } from "@/components/dashboard/leads/ClaimedLeadCard";
import { PushEnableBanner } from "@/components/dashboard/leads/PushEnableBanner";
import { LeadsHeaderStrip } from "@/components/dashboard/leads/LeadsHeaderStrip";
import { LeadsMetricsGrid } from "@/components/dashboard/leads/LeadsMetricsGrid";
import { toArabicDigits } from "@/lib/utils/format";

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
      {/* 1. شريط التبويبات الموحد المتصل بعرض الناف بار max-w-7xl */}
      <DashboardSubnav openLeadsCount={split.open.length} />

      {/* 2. شريط هوية الفني وسياق التخصص المقتضب مع مبدل الملفات */}
      {dashboardData && (
        <LeadsHeaderStrip
          profile={dashboardData.profile}
          craftsmen={briefs}
          activeCraftsmanId={activeId}
          counts={openCountsRecord}
          openCount={split.open.length}
        />
      )}

      {/* 3. مصفوفة المؤشرات السريعة للعروض */}
      <LeadsMetricsGrid
        openCount={split.open.length}
        activeClaimedCount={activeClaimed.length}
        closedClaimedCount={closedClaimed.length}
      />

      {/* 4. تنبيهات الإشعارات والملفات المهنية الأخرى */}
      <div className="space-y-4">
        <PushEnableBanner />
        <OtherProfilesAlert items={otherProfiles} />
      </div>

      {/* 5. قسم العروض المفتوحة الفورية المتاحة للرد */}
      <section aria-labelledby="open-leads-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="open-leads-heading" className="font-heading text-lg sm:text-xl font-bold text-foreground">
              طلبات العمل المتاحة في تخصصك
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              كن من أوائل الفنيين المستجيبين للتواصل مباشرة مع العميل في السويس
            </p>
          </div>
          {split.open.length > 0 && (
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent border border-accent/20">
              {toArabicDigits(split.open.length)} متاح
            </span>
          )}
        </div>

        <OpenLeadsLiveList open={split.open} />

        {split.open.length === 0 && (
          <div className="bg-card p-8 sm:p-10 rounded-2xl border border-border/80 text-center shadow-xs">
            <p className="font-heading text-base sm:text-lg font-bold text-foreground">
              لا توجد عروض عمل جديدة حالياً
            </p>
            <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed max-w-md mx-auto">
              سنرسل لك إشعاراً فورياً على هاتفك بمجرد قيام عميل في السويس بطلب فني في تخصصك.
            </p>
          </div>
        )}
      </section>

      {/* 6. قسم طلباتي المقبولة (المستلمة) */}
      <section aria-labelledby="claimed-leads-heading" className="space-y-4 pt-2" id="claimed-leads">
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-6">
          <div>
            <h3 id="claimed-leads-heading" className="font-heading text-lg sm:text-xl font-bold text-foreground">
              طلبات قمت بقبولها وتتواصل مع أصحابها
            </h3>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              أرقام هواتف العملاء متاحة هنا للاتصال المباشر ومراسلتهم عبر واتساب
            </p>
          </div>
          {activeClaimed.length > 0 && (
            <span className="rounded-full bg-action/15 px-3 py-1 text-xs font-bold text-action border border-action/20">
              {toArabicDigits(activeClaimed.length)} جاري
            </span>
          )}
        </div>

        {activeClaimed.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {activeClaimed.map((lead) => (
              <ClaimedLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <div className="bg-card/60 p-6 sm:p-8 rounded-2xl border border-border/70 text-center">
            <p className="text-sm font-semibold text-muted">
              لم تقبل أي طلب بعد — فور قبولك لأي طلب مفتوح ستظهر بيانات العميل ورقم هاتفه هنا فوراً.
            </p>
          </div>
        )}

        {/* الأرشيف والطلبات المغلقة */}
        <ClosedLeadsGroup leads={closedClaimed} />
        <ClosedLeadsGroup
          leads={otherClaimed}
          title="طلبات مستلمة من ملفاتك المهنية الأخرى"
        />
      </section>
    </div>
  );
}
