"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/shared/ui/Button";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { IconStar } from "@/components/shared/icons";
import { ReviewCard } from "@/components/craftsman/ReviewCard";
import { toArabicDigits } from "@/lib/utils/format";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useConfirmDialog } from "@/hooks/ui/useConfirmDialog";
import { useReviews } from "@/hooks/craftsman/useReviews";
import { AuthGuardModal } from "@/components/shared/auth/AuthGuardModal";
import { ReviewModal } from "@/components/craftsman/ReviewModal";
import { AllReviewsModal } from "@/components/craftsman/AllReviewsModal";
import { useSession } from "@/hooks/auth/useSession";
import { deleteReviewAction } from "@/app/actions/reviews";

interface CraftsmanReviewsSectionProps {
  craftsmanId: string;
  craftsmanName: string;
  ownerUserId: string | null;
}

export function CraftsmanReviewsSection({
  craftsmanId,
  craftsmanName,
  ownerUserId,
}: CraftsmanReviewsSectionProps) {
  const { user, isLoggedIn } = useSession();
  const isOwner = Boolean(user?.id && user.id === ownerUserId);
  const {
    summary,
    reviews,
    userReview,
    loading,
    reload,
    publishLocally,
    removeLocally,
  } = useReviews(craftsmanId);
  const { ask: askConfirm, dialogProps: confirmDialogProps } = useConfirmDialog();
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  // حالة فتح المودالات محلية بالـ state لا مرتبطة بالـ URL: الصفحة ستاتيك
  // (generateStaticParams) وغير متأثرة بالـ query، وربط الفتح والإغلاق بالـ URL
  // يجعل Next.js يعيد تثبيت الـ query القديمة من الـ route cache عند
  // router.replace على مسار نظيف، فيبقى المودال مفتوحاً بعد الإرسال.
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAllReviewsOpen, setIsAllReviewsOpen] = useState(false);
  const {
    isOpen: isAuthGuardOpen,
    guardOptions,
    requireAuth,
    handleSuccess: handleAuthSuccess,
    handleClose: handleAuthClose,
  } = useAuthGuard();

  const openReviewModal = useCallback(() => setIsReviewModalOpen(true), []);
  const closeReviewModal = useCallback(() => setIsReviewModalOpen(false), []);

  // الضغط على إضافة تقييم مع حارس تسجيل الدخول
  const handleAddReviewClick = () => {
    if (isOwner) return;
    requireAuth(openReviewModal, {
      title: "تسجيل الدخول لإضافة تقييم",
      message:
        "يرجى تسجيل الدخول بحساب جوجل لنشر تقييمك الحقيقي؛ فنحن نعرض تقييمات الحسابات الموثقة فقط لضمان المصداقية.",
      actionDescription: `تقييم تجربة التعامل مع ${craftsmanName}`,
    });
  };

  /**
   * بعد نجاح الحفظ: يُدرَج التقييم في القائمة فوراً (تفاؤلياً) ويُغلق المودال،
   * ثم تُجلب البيانات الحقيقية في الخلفية لتوفيق الحالة دون إظهار أي انتظار.
   */
  const handleReviewSuccess = (published: {
    rating: number;
    comment: string | null;
  }) => {
    publishLocally(published.rating, published.comment);
    closeReviewModal();
    void reload();
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    const confirmed = await askConfirm({
      title: "حذف التقييم",
      message:
        "هل أنت متأكد من رغبتك في حذف تقييمك؟ لن تتمكن من التراجع عن هذا الإجراء.",
      confirmLabel: "نعم، احذف التقييم",
      danger: true,
    });
    if (!confirmed) return;
    setDeletingReviewId(reviewId);
    const ok = await deleteReviewAction(user.id, reviewId, craftsmanId);
    setDeletingReviewId(null);
    if (ok) {
      removeLocally();
      void reload();
    }
  };

  const visibleReviews = reviews.slice(0, 3);

  return (
    <section
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
          <div className="space-y-4">
            {visibleReviews.map((rev) => {
              const isMyReview = Boolean(user && rev.userId === user.id);
              return (
                <ReviewCard
                  key={rev.id}
                  name={rev.userName}
                  avatarUrl={rev.userAvatarUrl}
                  avatarName={rev.userName}
                  rating={rev.rating}
                  comment={rev.comment}
                  createdAt={rev.createdAt}
                  showBadge={isMyReview}
                  onEdit={isMyReview ? openReviewModal : undefined}
                  onDelete={isMyReview ? () => handleDeleteReview(rev.id) : undefined}
                  deleting={deletingReviewId === rev.id}
                />
              );
            })}

            {/* عرض كل التقييمات إذا كانت أكثر من 3 */}
            {reviews.length > 3 && (
              <div className="pt-2 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setIsAllReviewsOpen(true)}
                >
                  عرض جميع التقييمات ({toArabicDigits(reviews.length)}) ←
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* حوار تأكيد الحذف */}
      {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}

      {/* مودال الحارس لتسجيل الدخول */}
      <AuthGuardModal
        open={isAuthGuardOpen}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
        title={guardOptions.title}
        message={guardOptions.message}
        actionDescription={guardOptions.actionDescription}
      />

      {/* مودال كتابة / تعديل التقييم */}
      {!isOwner && isLoggedIn && user && (
        <ReviewModal
          open={isReviewModalOpen}
          onClose={closeReviewModal}
          craftsmanId={craftsmanId}
          craftsmanName={craftsmanName}
          userId={user.id}
          existingReview={userReview}
          onSuccess={handleReviewSuccess}
          onDeleted={() => {
            removeLocally();
            void reload();
          }}
        />
      )}

      {/* مودال عرض جميع التقييمات */}
      <AllReviewsModal
        open={isAllReviewsOpen}
        onClose={() => setIsAllReviewsOpen(false)}
        craftsmanName={craftsmanName}
        summary={summary}
        reviews={reviews}
        onAddReviewClick={handleAddReviewClick}
        isOwner={isOwner}
        currentUserId={user?.id}
        onEditReview={() => {
          setIsAllReviewsOpen(false);
          openReviewModal();
        }}
        onDeleteReview={handleDeleteReview}
        deletingReviewId={deletingReviewId}
      />
    </section>
  );
}