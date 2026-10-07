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
import { DashboardChips } from "@/components/dashboard/DashboardChips";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PageTitleRow } from "@/components/shared/ui/PageTitleRow";
import { ClosedLeadsGroup } from "@/components/dashboard/leads/ClosedLeadsGroup";
import { OtherProfilesAlert } from "@/components/dashboard/leads/OtherProfilesAlert";
import { ProfileSwitcher } from "@/components/dashboard/ProfileSwitcher";
import { OpenLeadsLiveList } from "@/components/dashboard/leads/OpenLeadsLiveList";
import { ClaimedLeadCard } from "@/components/dashboard/leads/ClaimedLeadCard";
import { PushEnableBanner } from "@/components/dashboard/leads/PushEnableBanner";
import { toArabicDigits } from "@/lib/utils/format";
import { IconBell, IconCheck, IconClock } from "@/components/shared/icons";

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
        <DashboardChips />
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

  // جلب بيانات البروفايل لعرض الهيدر الموحد والمعاينة
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* العمود الجانبي الأيمن: الهيدر والتنقل والتنبيهات (4 أعمدة) */}
        <div className="lg:col-span-4 space-y-6">
          {dashboardData && (
            <DashboardHeader
              profile={dashboardData.profile}
              action={
                <ProfileSwitcher
                  craftsmen={briefs}
                  activeCraftsmanId={activeId}
                  counts={openCountsRecord}
                />
              }
            />
          )}

          <DashboardChips variant="sidebar" />

          {/* تنبيه الإشعارات اللحظية وعروض الملفات الأخرى */}
          <div className="space-y-4">
            <PushEnableBanner />
            <OtherProfilesAlert items={otherProfiles} />
          </div>
        </div>

        {/* العمود الرئيسي الأيسر: لوحة العمليات ومتابعة العروض (8 أعمدة) */}
        <div className="lg:col-span-8 space-y-6">
          {/* كروت المؤشرات السريعة للعروض */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-center shadow-xs">
              <span className="flex h-8 w-8 mx-auto items-center justify-center rounded-xl bg-accent/10 text-accent">
                <IconBell className="h-4 w-4" />
              </span>
              <p className="mt-2 font-heading text-xl sm:text-2xl font-black text-foreground">
                {toArabicDigits(split.open.length)}
              </p>
              <p className="text-[11px] sm:text-xs text-muted font-bold">عروض متاحة للرد</p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-center shadow-xs">
              <span className="flex h-8 w-8 mx-auto items-center justify-center rounded-xl bg-action/15 text-action">
                <IconClock className="h-4 w-4" />
              </span>
              <p className="mt-2 font-heading text-xl sm:text-2xl font-black text-foreground">
                {toArabicDigits(activeClaimed.length)}
              </p>
              <p className="text-[11px] sm:text-xs text-muted font-bold">طلبات قيد التواصل</p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-center shadow-xs">
              <span className="flex h-8 w-8 mx-auto items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <IconCheck className="h-4 w-4" />
              </span>
              <p className="mt-2 font-heading text-xl sm:text-2xl font-black text-foreground">
                {toArabicDigits(closedClaimed.length)}
              </p>
              <p className="text-[11px] sm:text-xs text-muted font-bold">طلبات سابقة</p>
            </div>
          </div>

          {/* 1. قسم العروض المفتوحة الفورية */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                  طلبات العمل المتاحة في تخصصك
                </h2>
                <p className="text-xs text-muted">
                  كن من أوائل الفنيين المستجيبين للتواصل مباشرة مع العميل في السويس
                </p>
              </div>
              {split.open.length > 0 && (
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                  {toArabicDigits(split.open.length)} متاح
                </span>
              )}
            </div>

            <OpenLeadsLiveList open={split.open} />

            {split.open.length === 0 && (
              <div className="bg-card p-8 rounded-2xl border border-border/80 text-center shadow-xs">
                <p className="font-heading text-base font-bold text-foreground">لا توجد عروض عمل جديدة حالياً</p>
                <p className="text-xs text-muted mt-1.5 leading-relaxed max-w-sm mx-auto">
                  سنرسل لك إشعاراً فورياً على هاتفك بمجرد قيام عميل في السويس بطلب فني في تخصصك.
                </p>
              </div>
            )}
          </div>

          {/* 2. قسم طلباتي المقبولة (المستلمة) */}
          <div className="space-y-4 pt-2" id="claimed-leads">
            <div className="flex items-center justify-between border-t border-border/70 pt-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  طلبات قمت بقبولها وتتواصل مع أصحابها
                </h3>
                <p className="text-xs text-muted">
                  أرقام هواتف العملاء متاحة هنا للاتصال المباشر ومراسلتهم عبر واتساب
                </p>
              </div>
              {activeClaimed.length > 0 && (
                <span className="rounded-full bg-action/15 px-2.5 py-0.5 text-xs font-bold text-action">
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
              <div className="bg-card/60 p-6 rounded-2xl border border-border/70 text-center">
                <p className="text-sm font-semibold text-muted">
                  لم تقبل أي طلب بعد — فور قبولك لأي طلب مفتوح ستظهر بيانات العميل ورقم هاتفه هنا فوراً.
                </p>
              </div>
            )}

            {/* الأرشيف والطلبات المغلقة */}
            <ClosedLeadsGroup leads={closedClaimed} />
            <ClosedLeadsGroup leads={otherClaimed} title="طلبات مستلمة من ملفاتك المهنية الأخرى" />
          </div>
        </div>
      </div>
  );
}
