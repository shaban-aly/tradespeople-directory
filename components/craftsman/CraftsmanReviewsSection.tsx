"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/shared/ui/Button";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { IconEdit, IconStar, IconTrash } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useReviews } from "@/hooks/craftsman/useReviews";
import { AuthGuardModal } from "@/components/shared/auth/AuthGuardModal";
import { ReviewModal } from "@/components/craftsman/ReviewModal";
import { AllReviewsModal } from "@/components/craftsman/AllReviewsModal";
import { useSession } from "@/hooks/auth/useSession";
import { deleteReview } from "@/lib/db/reviews";

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

  const { user, isLoggedIn, profile, loading: sessionLoading } = useSession();
  const isOwner = Boolean(profile?.craftsmanId && profile.craftsmanId === craftsmanId);
  const { summary, reviews, userReview, loading, reload } = useReviews(craftsmanId);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
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
        // replace بدل push عشان إزالة الباراميتر ما تضيفش entry جديد في الـ history
        // وده بيمنع التعليق عند الإغلاق لما المودال بيتفتح مباشرة من رابط مشارك
        router.replace(`${pathname}${query}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // لو المستخدم فتح الرابط وفيه ?review=new لكنه مش مسجل دخول بعد تحميل الـ session
  // نمسح الباراميتر لتفادي إظهار المودال في state غلطة تسبب التعليق
  useEffect(() => {
    if (!sessionLoading && isReviewModalOpen && !isLoggedIn) {
      updateUrlParam("review", null);
    }
  }, [sessionLoading, isLoggedIn, isReviewModalOpen, updateUrlParam]);

  // الضغط على إضافة تقييم مع حارس تسجيل الدخول
  const handleAddReviewClick = () => {
    if (isOwner) return;
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

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف تقييمك؟")) return;
    setDeletingReviewId(reviewId);
    const ok = await deleteReview(user.id, reviewId, craftsmanId);
    setDeletingReviewId(null);
    if (ok) {
      reload();
    }
  };

  const visibleReviews = reviews.slice(0, 3);

  return (
    <section
      data-tour="details-reviews"
      className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
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

          {!isOwner && (
            <Button variant="action" onClick={handleAddReviewClick}>
              {userReview ? "تعديل تقييمك ⭐" : "+ أضف تقييمك"}
            </Button>
          )}
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
            description={
              isOwner
                ? "لم يقم أي عميل بكتابة تقييم لصفحتك بعد. شارك رابط صفحتك مع عملائك بعد إتمام الشغل ليشاركوا تجاربهم."
                : `هل سبق لك التعامل مع ${craftsmanName}؟ شاركنا رأيك وساعد باقي أهالي السويس في اختيار الصنايعي المناسب.`
            }
            action={
              !isOwner ? (
                <Button variant="ghost" onClick={handleAddReviewClick}>
                  كن أول من يقيّم
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {visibleReviews.map((rev) => {
              const isMyReview = Boolean(user && rev.userId === user.id);
              return (
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
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">
                            {rev.userName}
                          </h4>
                          {isMyReview && (
                            <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                              تقييمك
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted">
                          {new Date(rev.createdAt).toLocaleDateString("ar-EG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
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

                      {isMyReview && (
                        <div className="flex items-center gap-1 border-r border-border/80 pr-2 mr-1">
                          <button
                            type="button"
                            onClick={() => updateUrlParam("review", "new")}
                            className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:border-accent hover:text-accent"
                            title="تعديل تقييمك"
                            aria-label="تعديل تقييمك"
                          >
                            <IconEdit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            disabled={deletingReviewId === rev.id}
                            className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
                            title="حذف تقييمك"
                            aria-label="حذف تقييمك"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="mt-2.5 text-sm text-foreground/90 leading-relaxed">
                      «{rev.comment}»
                    </p>
                  )}
                </div>
              );
            })}

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
      {!isOwner && isLoggedIn && user && (
        <ReviewModal
          open={isReviewModalOpen}
          onClose={() => updateUrlParam("review", null)}
          craftsmanId={craftsmanId}
          craftsmanName={craftsmanName}
          userId={user.id}
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
        isOwner={isOwner}
        currentUserId={user?.id}
        onEditReview={() => {
          updateUrlParam("reviews", null);
          updateUrlParam("review", "new");
        }}
        onDeleteReview={handleDeleteReview}
      />
    </section>
  );
}