"use client";

import { Modal } from "@/components/shared/ui/Modal";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { ReviewCard } from "@/components/craftsman/ReviewCard";
import { IconStar } from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import type { ReviewItem, RatingSummary } from "@/lib/db/reviews";

interface AllReviewsModalProps {
  open: boolean;
  onClose: () => void;
  craftsmanName: string;
  summary: RatingSummary;
  reviews: ReviewItem[];
  onAddReviewClick: () => void;
  isOwner?: boolean;
  currentUserId?: string | null;
  onEditReview?: (review: ReviewItem) => void;
  onDeleteReview?: (reviewId: string) => void;
  /** معرّف التقييم الجاري حذفه لتعطيل زره فقط. */
  deletingReviewId?: string | null;
}

export function AllReviewsModal({
  open,
  onClose,
  craftsmanName,
  summary,
  reviews,
  onAddReviewClick,
  isOwner = false,
  currentUserId,
  onEditReview,
  onDeleteReview,
  deletingReviewId,
}: AllReviewsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`تقييمات ${craftsmanName}`}
      description={
        <div className="flex items-center gap-2 text-sm text-muted">
          {summary.totalReviews > 0 ? (
            <>
              <div className="flex items-center gap-1 text-amber-500">
                <IconStar className="h-4 w-4 fill-current" />
                <span className="font-heading font-extrabold text-foreground">
                  {toArabicDigits(summary.average.toFixed(1))}
                </span>
              </div>
              <span>·</span>
            </>
          ) : null}
          <span className="font-medium">{toArabicDigits(summary.totalReviews)} تقييم</span>
        </div>
      }
      headerAction={
        !isOwner ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddReviewClick();
            }}
            className="rounded-xl bg-accent/10 px-3.5 py-2 font-heading text-xs sm:text-sm font-bold text-accent transition-colors hover:bg-accent/20"
          >
            + أضف تقييمك
          </button>
        ) : null
      }
    >
      {reviews.length === 0 ? (
        <EmptyState
          icon="💬"
          title="لا توجد تقييمات حتى الآن"
          description="كن أول من يقيّم هذا الصنايعي!"
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const isMyReview = Boolean(
              currentUserId && rev.userId === currentUserId,
            );
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
                onEdit={
                  isMyReview && onEditReview
                    ? () => {
                        onClose();
                        onEditReview(rev);
                      }
                    : undefined
                }
                onDelete={
                  isMyReview && onDeleteReview
                    ? () => onDeleteReview(rev.id)
                    : undefined
                }
                deleting={deletingReviewId === rev.id}
              />
            );
          })}
        </div>
      )}
    </Modal>
  );
}