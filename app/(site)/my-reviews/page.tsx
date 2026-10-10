import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "@/lib/db/server";
import { getUserAllReviews } from "@/lib/db/reviews-queries";
import { MyReviewsSection } from "@/components/activity/MyReviewsSection";
import { PageTitleRow } from "@/components/shared/ui/PageTitleRow";

export const metadata: Metadata = {
  title: "تقييماتي ومراجعاتي | دليل الصنايعية",
  description: "التقييمات والآراء التي كتبتها للصنايعية في دليل الصنايعية السويس.",
  robots: { index: false, follow: false },
};

export default async function MyReviewsPage() {
  const { supabase, user } = await getServerSession();

  if (!user) {
    redirect("/login?reason=reviews&next=/my-reviews");
  }

  const reviews = await getUserAllReviews(user.id, supabase);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10 space-y-6">
      <PageTitleRow
        title="تقييماتي ومراجعاتي"
        description="جميع التقييمات والآراء التي شاركتها لمساعدة أهالي السويس في اختيار الصنايعية"
        backFallback="/activity"
        backLabel="نشاطاتي"
      />

      <MyReviewsSection userId={user.id} initialReviews={reviews} />
    </div>
  );
}
