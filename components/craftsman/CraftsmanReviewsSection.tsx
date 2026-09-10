"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/shared/ui/Button";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { IconStar } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useReviews } from "@/hooks/craftsman/useReviews";
import { AuthGuardModal } from "@/components/shared/auth/AuthGuardModal";
import { ReviewModal } from "@/components/craftsman/ReviewModal";
import { AllReviewsModal } from "@/components/craftsman/AllReviewsModal";
import { useSession } from "@/hooks/auth/useSession";

interface CraftsmanReviewsSectionProps {
  craftsmanId: string;
  craftsmanName: string;
}

export function CraftsmanReviewsSection({
  craftsmanId,
  craftsmanName,
}: CraftsmanReviewsSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const { user, isLoggedIn } = useSession();
  const { summary, reviews, userReview, loading, reload } = useReviews(craftsmanId);
  const {
    isOpen: isAuthGuardOpen,
    guardOptions,
    requireAuth,
    handleSuccess: handleAuthSuccess,
    handleClose: handleAuthClose,
  } = useAuthGuard();

  // حالة فتح المودالات عبر الـ URL
  const isAllReviewsOpen = searchParams?.get("reviews") === "all";
  const isReviewModalOpen = searchParams?.get("review") === "new";

  // دالة تحديث معلمات الرابط بدون ريفريش كامل
  const updateUrlParam = useCallback(
    (key: string, value: string | null) => {
      const current = new URLSearchParams(searchParams ? searchParams.toString() : "");
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
      const search = current.toString();
      const query = search ? `?${search}` : "";
      startTransition(() => {
        router.push(`${pathname}${query}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // الضغط على إضافة تقييم مع حارس تسجيل الدخول
  const handleAddReviewClick = () => {
    requireAuth(
      () => {
        updateUrlParam("review", "new");
      },
      {
        title: "تسجيل الدخول لإضافة تقييم",
        message:
          "يرجى تسجيل الدخول بحساب جوجل لنشر تقييمك الحقيقي؛ فنحن نعرض تقييمات الحسابات الموثقة فقط لضمان المصداقية.",
        actionDescription: `تقييم تجربة التعامل مع ${craftsmanName}`,
      }
    );
  };

  const handleReviewSuccess = () => {
    reload();
    updateUrlParam("review", null);
  };

  const visibleReviews = reviews.slice(0, 3);
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "عميل";

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
      {/* هيدر القسم */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              آراء وتقييمات العملاء
            </h2>
            {summary.totalReviews > 0 && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {toArabicDigits(summary.totalReviews)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            تجارب حقيقية من أهالي السويس الذين تعاملوا مع {craftsmanName}
          </p>
        </div>

        {/* ملخص النجوم والزرار */}
        <div className="flex flex-wrap items-center gap-3">
          {summary.totalReviews > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-background px-4 py-2 border border-border">
              <IconStar className="h-5 w-5 fill-amber-500 text-amber-500" />
              <span className="font-bold text-base text-foreground">
                {toArabicDigits(summary.average.toFixed(1))}
              </span>
              <span className="text-xs text-muted">
                ({toArabicDigits(summary.totalReviews)})
              </span>
            </div>
          ) : (
            <div className="flex items-center rounded-2xl bg-background px-4 py-2 border border-border">
              <span className="font-bold text-base text-accent">جديد</span>
            </div>
          )}

          <Button variant="action" onClick={handleAddReviewClick}>
            {userReview ? "تعديل تقييمك ⭐" : "+ أضف تقييمك"}
          </Button>
        </div>
      </div>

      {/* قائمة أول 3 مراجعات */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-2xl bg-background border border-border" />
            <div className="h-20 rounded-2xl bg-background border border-border" />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon="💬"
            title="لا توجد تقييمات مسجلة بعد"
            description={`هل سبق لك التعامل مع ${craftsmanName}؟ شاركنا رأيك وساعد باقي أهالي السويس في اختيار الصنايعي المناسب.`}
            action={
              <Button variant="ghost" onClick={handleAddReviewClick}>
                كن أول من يقيّم
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {visibleReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-border bg-background/40 p-4 transition-colors hover:border-accent/30 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                      {rev.userName.charAt(0) || "ع"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {rev.userName}
                      </h4>
                      <p className="text-[11px] text-muted">
                        {new Date(rev.createdAt).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStar
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < rev.rating ? "fill-current" : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="mt-2.5 text-sm text-foreground/90 leading-relaxed">
                    «{rev.comment}»
                  </p>
                )}
              </div>
            ))}

            {/* رابط عرض كل التقييمات إذا كانت أكثر من 3 برابط في الـ URL */}
            {reviews.length > 3 && (
              <div className="pt-2 text-center">
                <Button
                  variant="ghost"
                  onClick={() => updateUrlParam("reviews", "all")}
                >
                  عرض جميع التقييمات ({toArabicDigits(reviews.length)}) ←
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* مودال الحارس لتسجيل الدخول */}
      <AuthGuardModal
        open={isAuthGuardOpen}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
        title={guardOptions.title}
        message={guardOptions.message}
        actionDescription={guardOptions.actionDescription}
      />

      {/* مودال كتابة / تعديل التقييم (برابط ?review=new) */}
      {isLoggedIn && user && (
        <ReviewModal
          open={isReviewModalOpen}
          onClose={() => updateUrlParam("review", null)}
          craftsmanId={craftsmanId}
          craftsmanName={craftsmanName}
          userId={user.id}
          userName={userName}
          existingReview={userReview}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* مودال عرض جميع التقييمات (برابط ?reviews=all) */}
      <AllReviewsModal
        open={isAllReviewsOpen}
        onClose={() => updateUrlParam("reviews", null)}
        craftsmanName={craftsmanName}
        summary={summary}
        reviews={reviews}
        onAddReviewClick={handleAddReviewClick}
      />
    </section>
  );
}