"use client";

import { Modal } from "@/components/shared/ui/Modal";
import { EmptyState } from "@/components/shared/ui/EmptyState";
import { IconEdit, IconStar, IconTrash } from "@/components/shared/icons";
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
                <span className="font-bold text-foreground">
                  {toArabicDigits(summary.average.toFixed(1))}
                </span>
              </div>
              <span>·</span>
            </>
          ) : null}
          <span>{toArabicDigits(summary.totalReviews)} تقييم</span>
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
            className="rounded-xl bg-accent/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-accent transition-colors hover:bg-accent/20"
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
            const isMyReview = Boolean(currentUserId && rev.userId === currentUserId);
            return (
              <div
                key={rev.id}
                className="rounded-2xl border border-border bg-background/50 p-4 transition-colors sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent">
                      {rev.userName.charAt(0) || "ع"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-foreground">
                          {rev.userName}
                        </h4>
                        {isMyReview && (
                          <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                            تقييمك
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        {new Date(rev.createdAt).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "long",
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
                          className={`h-4 w-4 ${
                            i < rev.rating ? "fill-current" : "text-border"
                          }`}
                        />
                      ))}
                    </div>

                    {isMyReview && (
                      <div className="flex items-center gap-1 border-r border-border/80 pr-2 mr-1">
                        {onEditReview && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditReview(rev);
                            }}
                            className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:border-accent hover:text-accent"
                            title="تعديل تقييمك"
                            aria-label="تعديل تقييمك"
                          >
                            <IconEdit className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDeleteReview && (
                          <button
                            type="button"
                            onClick={() => onDeleteReview(rev.id)}
                            className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:border-danger hover:text-danger"
                            title="حذف تقييمك"
                            aria-label="حذف تقييمك"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {rev.comment && (
                  <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
                    «{rev.comment}»
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}