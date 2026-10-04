"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { type RatingSummary, type ReviewItem } from "@/lib/db/reviews";
import {
  fetchCraftsmanRatingSummaryAction,
  fetchCraftsmanReviewsAction,
  fetchUserReviewAction,
} from "@/app/actions/reviews-queries-actions";

/**
 * جلب بيانات التقييمات (دالة خالصة على مستوى الموديول — بلا setState).
 * وجودها هنا يسمح للـ effect و reload أن يتشاركا المنطق بلا دالة
 * داخلية تُعاد إنشاؤها كل ريندر (والتي كانت مصدر تحذير exhaustive-deps).
 */
async function fetchReviewsData(craftsmanId: string, userId: string | undefined) {
  const [summary, reviews] = await Promise.all([
    fetchCraftsmanRatingSummaryAction(craftsmanId),
    fetchCraftsmanReviewsAction(craftsmanId),
  ]);
  const userReview = userId
    ? await fetchUserReviewAction(userId, craftsmanId)
    : null;
  return { summary, reviews, userReview };
}

// جلب تقييمات صنايعي (الملخص + القائمة + تقييم المستخدم إن وُجد)
// مع إعادة تحميل يدوية بعد نشر/تعديل/حذف تقييم.
export function useReviews(craftsmanId: string) {
  const { user } = useSession();
  const userId = user?.id;

  const [summary, setSummary] = useState<RatingSummary>({
    average: 0,
    totalReviews: 0,
  });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [userReview, setUserReview] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // يبدأ بـ await مباشرةً فلا يقع setState متزامن في جسم الـ effect،
    // وcancelled يمنع الكتابة بعد تغيّر الـ id أو بعد الـ unmount.
    void (async () => {
      const result = await fetchReviewsData(craftsmanId, userId);
      if (cancelled) return;
      setSummary(result.summary);
      setReviews(result.reviews);
      setUserReview(result.userReview);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [craftsmanId, userId]);

  // إعادة تحميل يدوية بعد نشر/تعديل/حذف تقييم.
  // تُستدعى من event handlers فقط، فلا تحتاج هوية مستقرة.
  async function reload() {
    setLoading(true);
    const result = await fetchReviewsData(craftsmanId, userId);
    setSummary(result.summary);
    setReviews(result.reviews);
    setUserReview(result.userReview);
    setLoading(false);
  }

  return {
    summary,
    reviews,
    userReview,
    loading,
    reload,
  };
}
