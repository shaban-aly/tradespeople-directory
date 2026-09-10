"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import {
  getCraftsmanRatingSummary,
  getCraftsmanReviews,
  getUserReviewForCraftsman,
  type RatingSummary,
  type ReviewItem,
} from "@/lib/db/reviews";

// جلب تقييمات صنايعي (الملخص + القائمة + تقييم المستخدم إن وُجد)
// مع إعادة تحميل يدوية بعد نشر/تعديل/حذف تقييم.
export function useReviews(craftsmanId: string) {
  const { user } = useSession();

  const [summary, setSummary] = useState<RatingSummary>({
    average: 0,
    totalReviews: 0,
  });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [userReview, setUserReview] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [summaryRes, reviewsRes] = await Promise.all([
      getCraftsmanRatingSummary(craftsmanId),
      getCraftsmanReviews(craftsmanId),
    ]);
    setSummary(summaryRes);
    setReviews(reviewsRes);

    if (user?.id) {
      const userRev = await getUserReviewForCraftsman(user.id, craftsmanId);
      setUserReview(userRev);
    }
    setLoading(false);
  }, [craftsmanId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    summary,
    reviews,
    userReview,
    loading,
    reload: loadData,
  };
}