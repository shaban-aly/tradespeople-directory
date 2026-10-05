"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { type RatingSummary, type ReviewItem } from "@/lib/db/reviews";
import {
  applyOptimisticReview,
  buildOptimisticReview,
  removeReviewLocally,
} from "@/lib/reviews";
import {
  fetchCraftsmanRatingSummaryAction,
  fetchCraftsmanReviewsAction,
  fetchUserReviewAction,
} from "@/app/actions/reviews-queries-actions";

/** حالة التقييمات مجمّعة في كائن واحد حتى تتحدث اللقطة دفعةً واحدة. */
interface ReviewsData {
  summary: RatingSummary;
  reviews: ReviewItem[];
  userReview: ReviewItem | null;
}

const EMPTY_DATA: ReviewsData = {
  summary: { average: 0, totalReviews: 0 },
  reviews: [],
  userReview: null,
};

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
  const userReview = userId ? await fetchUserReviewAction(userId, craftsmanId) : null;
  return { summary, reviews, userReview } satisfies ReviewsData;
}

// جلب تقييمات صنايعي (الملخص + القائمة + تقييم المستخدم إن وُجد)
// مع إعادة تحميل صامتة وتحديث تفاؤلي بعد نشر/تعديل/حذف تقييم.
export function useReviews(craftsmanId: string) {
  const { user, profile } = useSession();
  const userId = user?.id;

  const [data, setData] = useState<ReviewsData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // يبدأ بـ await مباشرةً فلا يقع setState متزامن في جسم الـ effect،
    // وcancelled يمنع الكتابة بعد تغيّر الـ id أو بعد الـ unmount.
    void (async () => {
      const result = await fetchReviewsData(craftsmanId, userId);
      if (cancelled) return;
      setData(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [craftsmanId, userId]);

  // إعادة تحميل صامتة بعد جلب جديد: لا تُظهر skeleton ولا تمسح القائمة
  // المعروضة، فلا يرتجف شيء أمام المستخدم أثناء المزامنة.
  const reload = useCallback(async () => {
    const result = await fetchReviewsData(craftsmanId, userId);
    setData(result);
  }, [craftsmanId, userId]);

  /**
   * إدراج/تحديث تقييم المستخدم محلياً بعد نجاح الحفظ، فيظهر في القائمة
   * فوراً دون انتظار رحلة للسيرفر. يُستدعى من event handler فقط.
   */
  const publishLocally = useCallback(
    (rating: number, comment: string | null) => {
      if (!userId) return;
      const now = new Date().toISOString();
      setData((prev) => {
        const optimistic = buildOptimisticReview(
          {
            craftsmanId,
            userId,
            userName: profile?.displayName ?? "",
            userAvatarUrl: profile?.avatarUrl ?? null,
            rating,
            comment,
          },
          prev.userReview,
          now,
        );
        return {
          ...applyOptimisticReview(prev.reviews, prev.summary, optimistic),
          userReview: optimistic,
        };
      });
    },
    [craftsmanId, userId, profile?.displayName, profile?.avatarUrl],
  );

  /** حذف تقييم المستخدم محلياً بعد نجاح الحذف. */
  const removeLocally = useCallback(() => {
    if (!userId) return;
    setData((prev) => ({
      ...removeReviewLocally(prev.reviews, prev.summary, userId),
      userReview: null,
    }));
  }, [userId]);

  return {
    summary: data.summary,
    reviews: data.reviews,
    userReview: data.userReview,
    loading,
    reload,
    publishLocally,
    removeLocally,
  };
}