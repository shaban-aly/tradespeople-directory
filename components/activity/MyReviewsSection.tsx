"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  IconStar,
  IconEdit,
  IconTrash,
  IconArrow,
} from "@/components/shared/icons";
import { toArabicDigits } from "@/lib/utils/format";
import {
  getUserAllReviews,
  deleteReview,
  type UserReviewDetail,
  type ReviewItem,
} from "@/lib/db/reviews";
import { ReviewModal } from "@/components/craftsman/ReviewModal";

interface MyReviewsSectionProps {
  userId: string;
  userName: string;
  initialReviews: UserReviewDetail[];
}

export function MyReviewsSection({
  userId,
  userName,
  initialReviews,
}: MyReviewsSectionProps) {
  const [reviews, setReviews] = useState<UserReviewDetail[]>(initialReviews);
  const [refreshing, setRefreshing] = useState(false);
  const [editingReview, setEditingReview] = useState<UserReviewDetail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    const data = await getUserAllReviews(userId);
    setReviews(data);
    setRefreshing(false);
  }, [userId]);

  async function handleDelete(reviewId: string, craftsmanId: string) {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا التقييم؟")) return;

    setDeletingId(reviewId);
    const success = await deleteReview(userId, reviewId, craftsmanId);
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
              <div
                key={rev.id}
                className="rounded-2xl border border-border bg-background/50 p-5 transition-colors hover:border-accent/30"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
                  {/* معلومات الصنايعي */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 font-bold text-accent overflow-hidden">
                      {rev.craftsmanImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rev.craftsmanImage}
                          alt={rev.craftsmanName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        rev.craftsmanName.charAt(0)
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/craftsman/${rev.craftsmanSlug}`}
                        className="font-bold text-base text-foreground hover:text-accent transition-colors"
                      >
                        {rev.craftsmanName}
                      </Link>
                      <p className="text-xs text-muted">{rev.categoryName}</p>
                    </div>
                  </div>

                  {/* النجوم وأزرار الإجراء */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
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

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingReview(rev)}
                        title="تعديل التقييم"
                        aria-label="تعديل التقييم"
                        className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rev.id, rev.craftsmanId)}
                        disabled={deletingId === rev.id}
                        title="حذف التقييم"
                        aria-label="حذف التقييم"
                        className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-50"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* نص التعليق والتاريخ */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {rev.comment ? `«${rev.comment}»` : <span className="text-xs text-muted">بدون تعليق مكتوب</span>}
                  </p>
                  <span className="text-xs text-muted shrink-0">
                    {new Date(rev.createdAt).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* مودال التعديل عند النقر على تعديل */}
      {editingReview && (
        <ReviewModal
          open={Boolean(editingReview)}
          onClose={() => setEditingReview(null)}
          craftsmanId={editingReview.craftsmanId}
          craftsmanName={editingReview.craftsmanName}
          userId={userId}
          userName={userName}
          existingReview={editingReview as unknown as ReviewItem}
          onSuccess={() => {
            setEditingReview(null);
            refreshData();
          }}
        />
      )}
    </section>
  );
}
