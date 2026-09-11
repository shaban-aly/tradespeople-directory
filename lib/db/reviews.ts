import { createSupabase } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export interface ReviewItem {
  id: string;
  craftsmanId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  average: number;
  totalReviews: number;
}

/**
 * كاش في الذاكرة لتقييمات الصنايعية لتسريع التصفح
 */
const reviewsCache = new Map<string, { reviews: ReviewItem[]; timestamp: number }>();
const summaryCache = new Map<string, { summary: RatingSummary; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // دقيقة واحدة

/**
 * جلب تقييمات صنايعي محدد مرتبة من الأحدث
 */
export async function getCraftsmanReviews(
  craftsmanId: string,
  limit?: number,
  client: SupabaseClient<Database> = createSupabase(),
): Promise<ReviewItem[]> {
  const cached = reviewsCache.get(craftsmanId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return limit ? cached.reviews.slice(0, limit) : cached.reviews;
  }

  let query = client
    .from("reviews")
    .select("id, craftsman_id, user_id, user_name, rating, comment, created_at, updated_at")
    .eq("craftsman_id", craftsmanId)
    .order("created_at", { ascending: false });

  if (limit && (!cached || now - cached.timestamp >= CACHE_TTL_MS)) {
    // نجلب أكثر إذا لم تكن في الكاش
    query = query.limit(Math.max(limit, 50));
  }

  const { data, error } = await query;

  if (error || !data) {
    return cached?.reviews ?? [];
  }

  const reviews: ReviewItem[] = data.map((row) => ({
    id: row.id,
    craftsmanId: row.craftsman_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  reviewsCache.set(craftsmanId, { reviews, timestamp: now });
  return limit ? reviews.slice(0, limit) : reviews;
}

/**
 * جلب ملخص تقييم الفني (المتوسط وإجمالي التقييمات)
 */
export async function getCraftsmanRatingSummary(
  craftsmanId: string,
  client: SupabaseClient<Database> = createSupabase(),
): Promise<RatingSummary> {
  const cached = summaryCache.get(craftsmanId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.summary;
  }

  // مصدر واحد للحقيقة: عرض craftsman_rating_summaries (المتوسط NULL عند
  // غياب التقييمات) بدل RPC قديم كان يُرجع 5.0 وهمية قبل وجود أي تقييم.
  const { data, error } = await client
    .from("craftsman_rating_summaries")
    .select("average_rating, total_reviews")
    .eq("craftsman_id", craftsmanId)
    .maybeSingle();

  if (error || !data) {
    return cached?.summary ?? { average: 0, totalReviews: 0 };
  }

  const summary: RatingSummary = {
    average: Number(data.average_rating) || 0,
    totalReviews: Number(data.total_reviews) || 0,
  };

  summaryCache.set(craftsmanId, { summary, timestamp: now });
  return summary;
}

/**
 * جلب تقييم المستخدم الحالي لصنايعي معين (إن وُجد) للتعديل عليه
 */
export async function getUserReviewForCraftsman(
  userId: string,
  craftsmanId: string
): Promise<ReviewItem | null> {
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, craftsman_id, user_id, user_name, rating, comment, created_at, updated_at")
    .eq("craftsman_id", craftsmanId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    craftsmanId: data.craftsman_id,
    userId: data.user_id,
    userName: data.user_name,
    rating: data.rating,
    comment: data.comment,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * إضافة أو تحديث تقييم
 *
 * ملاحظة أمنية: اسم المقيّم لا يُستقبل من العميل إطلاقًا — يُشتق من
 * profiles.display_name على مستوى قاعدة البيانات (حارس guard_review_write).
 */
export async function upsertReview(params: {
  userId: string;
  craftsmanId: string;
  rating: number;
  comment?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId, craftsmanId, rating, comment } = params;

  if (rating < 1 || rating > 5) {
    return { success: false, error: "التقييم يجب أن يكون بين 1 و 5 نجوم" };
  }

  if (comment && comment.length > 500) {
    return { success: false, error: "التعليق يجب ألا يتجاوز 500 حرف" };
  }

  const supabase = createSupabase();
  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: userId,
      craftsman_id: craftsmanId,
      rating,
      comment: comment?.trim() || null,
    },
    { onConflict: "user_id,craftsman_id" }
  );

  if (error) {
    // التقييم من نفس المستخدم لنفس الصانع موجود مسبقًا
    if (error.code === "23505") {
      return {
        success: false,
        error: "لقد قيّمت هذا الصنايعي من قبل — التقييم الواحد لكل عميل وصانع",
      };
    }
    return { success: false, error: error.message || "فشل حفظ التقييم" };
  }

  // إبطال كاش هذا الفني فوراً
  reviewsCache.delete(craftsmanId);
  summaryCache.delete(craftsmanId);

  return { success: true };
}

export interface UserReviewDetail extends ReviewItem {
  craftsmanName: string;
  craftsmanSlug: string;
  craftsmanImage: string | null;
  categoryName: string;
}

/**
 * جلب جميع التقييمات التي كتبها المستخدم مع بيانات الصنايعي لصفحة البروفايل
 */
export async function getUserAllReviews(
  userId: string,
  client: SupabaseClient<Database> = createSupabase(),
): Promise<UserReviewDetail[]> {
  const { data, error } = await client
    .from("reviews")
    .select(`
      id,
      craftsman_id,
      user_id,
      user_name,
      rating,
      comment,
      created_at,
      updated_at,
      craftsman:craftsmen(
        name,
        slug,
        image_url,
        category:categories(name)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const c = row.craftsman as unknown as {
      name: string;
      slug: string;
      image_url: string | null;
      category: { name: string } | null;
    } | null;

    return {
      id: row.id,
      craftsmanId: row.craftsman_id,
      userId: row.user_id,
      userName: row.user_name,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      craftsmanName: c?.name || "صنايعي",
      craftsmanSlug: c?.slug || "",
      craftsmanImage: c?.image_url || null,
      categoryName: c?.category?.name || "",
    };
  });
}

/**
 * حذف تقييم العميل
 */
export async function deleteReview(
  userId: string,
  reviewId: string,
  craftsmanId?: string
): Promise<boolean> {
  const supabase = createSupabase();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (!error && craftsmanId) {
    reviewsCache.delete(craftsmanId);
    summaryCache.delete(craftsmanId);
  }

  return !error;
}
