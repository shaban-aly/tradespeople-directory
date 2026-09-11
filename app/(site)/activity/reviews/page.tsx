import Link from "next/link";
import { getServerSession } from "@/lib/db/server";
import { getUserAllReviews } from "@/lib/db/reviews";
import { MyReviewsSection } from "@/components/activity/MyReviewsSection";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import {
  IconStar,
  IconArrow,
} from "@/components/shared/icons";

export default async function MyReviewsPage() {
  const { supabase, user } = await getServerSession();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <IconStar className="h-8 w-8 fill-current" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
            تقييماتي ومراجعاتي
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted leading-relaxed">
            سجّل دخولك لعرض التقييمات التي كتبتها للصنايعية وإدارتها.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center">
            <GoogleSignInButton redirectTo="/activity/reviews" />
          </div>

          <div className="mt-6 border-t border-border/50 pt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent transition-colors hover:underline"
            >
              <IconArrow className="h-3.5 w-3.5" />
              <span>العودة لتصفح دليل الصنايعية</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reviews = await getUserAllReviews(user.id, supabase);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      {/* مسار التنقل */}
      <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="font-bold transition-colors hover:text-accent">
          الرئيسية
        </Link>
        <span aria-hidden>·</span>
        <Link href="/profile" className="font-bold transition-colors hover:text-accent">
          حسابي
        </Link>
        <span aria-hidden>·</span>
        <Link href="/activity" className="font-bold transition-colors hover:text-accent">
          نشاطاتي
        </Link>
        <span aria-hidden>·</span>
        <span className="font-bold text-foreground">تقييماتي</span>
      </nav>

      {/* هيدر الصفحة */}
      <div className="border-b border-border pb-5">
        <h1 className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
          تقييماتي ومراجعاتي
        </h1>
        <p className="mt-1 text-sm text-muted">
          جميع التقييمات والآراء التي شاركتها لمساعدة أهالي السويس في اختيار الصنايعية
        </p>
      </div>

      {/* قسم التقييمات */}
      <MyReviewsSection userId={user.id} initialReviews={reviews} />
    </div>
  );
}