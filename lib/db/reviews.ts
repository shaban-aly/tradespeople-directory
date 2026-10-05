import { createServerReadClient } from "./client";
import { CACHE_TAGS, makeKeyedCache } from "./cache";
import { getReviewerAvatars } from "./reviewer-avatars";

export interface ReviewItem {
  id: string;
  craftsmanId: string;
  userId: string;
  userName: string;
  /** صورة صاحب التقييم (profiles.avatar_url) — NULL فالحرف الأول هو البديل. */
  userAvatarUrl: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  average: number;
  totalReviews: number;
}

async function getCraftsmanReviewsImpl(
  craftsmanId: string,
  limit?: number,
): Promise<ReviewItem[]> {
  const client = createServerReadClient();
  let query = client
    .from("reviews")
    .select("id, craftsman_id, user_id, user_name, rating, comment, created_at, updated_at")
    .eq("craftsman_id", craftsmanId)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(Math.max(limit, 50));
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  // صورة صاحب كل تقييم: `profiles` ممنوعة على anon فالقراءة عبر RPC عام مقيّد.
  const avatars = await getReviewerAvatars(data.map((row) => row.user_id));

  const reviews: ReviewItem[] = data.map((row) => ({
    id: row.id,
    craftsmanId: row.craftsman_id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatarUrl: avatars[row.user_id] ?? null,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return limit ? reviews.slice(0, limit) : reviews;
}

/**
 * جلب تقييمات صنايعي محدد مرتبة من الأحدث
 */
export const getCraftsmanReviews = makeKeyedCache(
  getCraftsmanReviewsImpl,
  "reviews-craftsman",
  (craftsmanId, limit?) => CACHE_TAGS.craftsmanReviews(craftsmanId)
);

async function getCraftsmanRatingSummaryImpl(
  craftsmanId: string,
): Promise<RatingSummary> {
  const client = createServerReadClient();
  // مصدر واحد للحقيقة: عرض craftsman_rating_summaries (المتوسط NULL عند
  // غياب التقييمات) بدل RPC قديم كان يُرجع 5.0 وهمية قبل وجود أي تقييم.
  const { data, error } = await client
    .from("craftsman_rating_summaries")
    .select("average_rating, total_reviews")
    .eq("craftsman_id", craftsmanId)
    .maybeSingle();

  if (error || !data) {
    return { average: 0, totalReviews: 0 };
  }

  return {
    average: Number(data.average_rating) || 0,
    totalReviews: Number(data.total_reviews) || 0,
  };
}

/**
 * جلب ملخص تقييم الفني (المتوسط وإجمالي التقييمات)
 */
export const getCraftsmanRatingSummary = makeKeyedCache(
  getCraftsmanRatingSummaryImpl,
  "reviews-summary",
  (craftsmanId) => CACHE_TAGS.craftsmanReviews(craftsmanId)
);
