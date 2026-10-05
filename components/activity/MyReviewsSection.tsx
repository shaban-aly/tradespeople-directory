"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { IconStar, IconArrow } from "@/components/shared/icons";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { ReviewCard } from "@/components/craftsman/ReviewCard";
import { useConfirmDialog } from "@/hooks/ui/useConfirmDialog";
import { toArabicDigits } from "@/lib/utils/format";
import { type ReviewItem } from "@/lib/db/reviews";
import { getUserAllReviews, type UserReviewDetail } from "@/lib/db/reviews-queries";
import { deleteReviewAction } from "@/app/actions/reviews";
import { ReviewModal } from "@/components/craftsman/ReviewModal";

interface MyReviewsSectionProps {
  userId: string;
  initialReviews: UserReviewDetail[];
}

export function MyReviewsSection({
  userId,
  initialReviews,
}: MyReviewsSectionProps) {
  const [reviews, setReviews] = useState<UserReviewDetail[]>(initialReviews);
  const [refreshing, setRefreshing] = useState(false);
  const [editingReview, setEditingReview] = useState<UserReviewDetail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { ask: askConfirm, dialogProps: confirmDialogProps } = useConfirmDialog();

  const refreshData = useCallback(
    async (options: { silent?: boolean } = {}) => {
      // التحميل الصامت لتوفيق البيانات بعد تحديث تفاؤلي بلا إظهار هيكل تحميل.
      if (!options.silent) setRefreshing(true);
      const data = await getUserAllReviews(userId);
      setReviews(data);
      setRefreshing(false);
    },
    [userId],
  );

  async function handleDelete(reviewId: string, craftsmanId: string) {
    const confirmed = await askConfirm({
      title: "حذف التقييم",
      message: "هل أنت متأكد من رغبتك في حذف هذا التقييم؟ لن تتمكن من التراجع عن هذا الإجراء.",
      confirmLabel: "نعم، احذف التقييم",
      danger: true,
    });
    if (!confirmed) return;

    setDeletingId(reviewId);
    const success = await deleteReviewAction(userId, reviewId, craftsmanId);
    setDeletingId(null);

    if (success) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl font-bold text-foreground">
              تقييماتي ومراجعاتي
            </h2>
            {reviews.length > 0 && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {toArabicDigits(reviews.length)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            جميع التقييمات والآراء التي شاركتها لمساعدة أهالي السويس
          </p>
        </div>
      </div>

      <div className="mt-6">
        {refreshing ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 rounded-2xl bg-background border border-border" />
            <div className="h-24 rounded-2xl bg-background border border-border" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/40 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <IconStar className="h-6 w-6 fill-current" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              لم تقم بكتابة أي تقييمات بعد
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted leading-relaxed">
              عندما تتعامل مع فني من دليل الصنايعية، شاركنا تجربتك لتقييمه ومساعدة باقي الأهالي في اختيار الأفضل.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground shadow-xs transition-colors hover:border-accent hover:text-accent"
            >
              <span>تصفح الصنايعية</span>
              <IconArrow className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <ReviewCard
                key={rev.id}
                name={
                  <Link
                    href={`/craftsman/${rev.craftsmanSlug}`}
                    className="transition-colors hover:text-accent"
                  >
                    {rev.craftsmanName}
                  </Link>
                }
                subtitle={rev.categoryName}
                avatarUrl={rev.craftsmanImage}
                avatarName={rev.craftsmanName}
                rating={rev.rating}
                comment={rev.comment}
                createdAt={rev.createdAt}
                onEdit={() => setEditingReview(rev)}
                onDelete={() => handleDelete(rev.id, rev.craftsmanId)}
                deleting={deletingId === rev.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* حوار تأكيد الحذف */}
      {confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />}

      {/* مودال التعديل عند النقر على تعديل */}
      {editingReview && (
        <ReviewModal
          open={Boolean(editingReview)}
          onClose={() => setEditingReview(null)}
          craftsmanId={editingReview.craftsmanId}
          craftsmanName={editingReview.craftsmanName}
          userId={userId}
          existingReview={editingReview as unknown as ReviewItem}
          onSuccess={(published) => {
            // تحديث تفاؤلي: تعديل الكارت في مكانه بلا انتظار إعادة الجلب.
            setEditingReview(null);
            setReviews((prev) =>
              prev.map((r) =>
                r.id === editingReview.id
                  ? { ...r, rating: published.rating, comment: published.comment }
                  : r,
              ),
            );
            void refreshData({ silent: true });
          }}
          onDeleted={() => {
            setEditingReview(null);
            setReviews((prev) => prev.filter((r) => r.id !== editingReview.id));
          }}
        />
      )}
    </section>
  );
}
