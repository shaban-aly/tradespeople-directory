import type { RatingSummary, ReviewItem } from "@/lib/db/reviews";

/**
 * منطق خالص للتعامل مع تقييمات العميل قبل وصول رد السيرفر (تفاؤلي).
 * الهدف: ظهور التقييم في القائمة فور الضغط على «نشر التقييم»
 * بدل انتظار رحلة للسيرفر تختفي أثناءها القائمة وتظهر skeleton.
 * تُستدعى داخل event handlers فقط (لا تُستدعى أثناء الريندر).
 */

/** تقييم مؤقت لمستخدم محلي؛ الـ id مؤقت حتى يصل رد السيرفر بالـ id الحقيقي. */
export interface LocalReviewInput {
  craftsmanId: string;
  userId: string;
  userName: string;
  /** صورة المستخدم من بروفايله — لتظهر فوراً بلا انتظار جلب الصورة. */
  userAvatarUrl: string | null;
  rating: number;
  comment: string | null;
}

/**
 * يبني عنصر التقييم المحلي. عند التحديث لنفس الصنايعي نعيد استخدام
 * الـ id والتاريخ القديمين حتى لا يتكرر التقييم في القائمة
 * (السيرفر يعمل upsert على user_id + craftsman_id).
 */
export function buildLocalReviewObject(
  input: LocalReviewInput,
  existing: ReviewItem | null,
  now: string,
): ReviewItem {
  const comment = input.comment?.trim() ? input.comment.trim() : null;
  return {
    id: existing?.id ?? `optimistic-${input.userId}`,
    craftsmanId: input.craftsmanId,
    userId: input.userId,
    userName: input.userName || existing?.userName || "عميل",
    userAvatarUrl: input.userAvatarUrl ?? existing?.userAvatarUrl ?? null,
    rating: input.rating,
    comment,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * يضع التقييم في أول القائمة (الأحدث أولاً) أو يحدّث تقييمه إن كان موجوداً،
 * ويعيد حساب الملخص محلياً بنفس معادلة قاعدة البيانات.
 */
export function applyLocalReviewUpdate(
  reviews: ReviewItem[],
  summary: RatingSummary,
  localReview: ReviewItem,
): { reviews: ReviewItem[]; summary: RatingSummary } {
  const isUpdate = reviews.some((r) => r.userId === localReview.userId);
  const nextReviews = isUpdate
    ? reviews.map((r) => (r.userId === localReview.userId ? localReview : r))
    : [localReview, ...reviews];

  const total = nextReviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    reviews: nextReviews,
    summary: {
      average: nextReviews.length ? total / nextReviews.length : 0,
      totalReviews: nextReviews.length,
    },
  };
}

/** يحذف التقييم محلياً من القائمة ويعيد حساب الملخص (بلا رحلة للسيرفر). */
export function removeReviewLocally(
  reviews: ReviewItem[],
  summary: RatingSummary,
  userId: string,
): { reviews: ReviewItem[]; summary: RatingSummary } {
  const nextReviews = reviews.filter((r) => r.userId !== userId);
  const total = nextReviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    reviews: nextReviews,
    summary: {
      average: nextReviews.length ? total / nextReviews.length : 0,
      totalReviews: nextReviews.length,
    },
  };
}