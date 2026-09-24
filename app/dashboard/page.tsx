import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/db/server";
import { getCraftsmanDashboardData } from "@/lib/db/craftsman-dashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProfileCompletionCard } from "@/components/dashboard/ProfileCompletionCard";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { CraftsmanStatsGrid } from "@/components/dashboard/CraftsmanStatsGrid";
import { CraftsmanActivityFeed } from "@/components/dashboard/CraftsmanActivityFeed";
import { ReviewsSection } from "@/components/dashboard/ReviewsSection";
import { ButtonLink } from "@/components/shared/ui/Button";
import { IconUser } from "@/components/shared/icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user } = await getServerSession();
  if (!user) notFound();

  const data = await getCraftsmanDashboardData(user.id, supabase);

  if (!data) {
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

  return (
    <>
      <DashboardHeader profile={data.profile} />
      <ProfileCompletionCard profile={data.profile} />
      <DashboardNav />
      <CraftsmanStatsGrid stats={data.stats} />
      <CraftsmanActivityFeed items={data.recentInteractions} />
      <ReviewsSection
        rating={data.stats.rating}
        reviews={data.stats.reviews}
        slug={data.profile.slug}
      />
    </>
  );
}