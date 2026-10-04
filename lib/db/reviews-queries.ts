import { createSupabase } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { ReviewItem } from "./reviews";

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
 * جلب تقييم المستخدم الحالي لصنايعي معين (إن وُجد) للتعديل عليه
 */
export async function getUserReviewForCraftsman(
  userId: string,
  craftsmanId: string,
  client: SupabaseClient<Database> = createSupabase(),
): Promise<ReviewItem | null> {
  const { data, error } = await client
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
